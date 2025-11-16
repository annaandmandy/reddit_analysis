"""
Migration Data Processor

Transforms raw Reddit user activity data into visualization-ready formats.
Detects migration patterns and calculates network metrics.
"""
import pandas as pd
import json
import networkx as nx
from datetime import datetime, timedelta
from collections import defaultdict
import argparse
from config import MIN_TIME_GAP_DAYS, MAX_TIME_GAP_DAYS, MIN_FLOW_THRESHOLD


class MigrationProcessor:
    """
    Transforms raw data into visualization-ready formats
    """

    def __init__(self, data_path=None, dataframe=None):
        """
        Initialize with either a file path or DataFrame

        Args:
            data_path: Path to CSV file with raw migration data
            dataframe: Pre-loaded DataFrame
        """
        if dataframe is not None:
            self.df = dataframe
        elif data_path:
            self.df = pd.read_csv(data_path, parse_dates=[
                'from_first', 'from_last', 'to_first', 'to_last'
            ])
        else:
            self.df = pd.DataFrame()

    def detect_migrations(self, user_df=None) -> pd.DataFrame:
        """
        Identifies actual migrations vs concurrent participation

        A migration is defined as:
        - User stopped posting in subreddit A (or significantly reduced activity)
        - User started posting in subreddit B after a time gap
        - Time gap is between MIN_TIME_GAP_DAYS and MAX_TIME_GAP_DAYS

        Returns:
            Clean migration events with timestamps
        """
        if user_df is None:
            user_df = self.df

        migrations = []

        for _, row in user_df.iterrows():
            # Calculate time gap between last post in from_sub and first post in to_sub
            if pd.isna(row['from_last']) or pd.isna(row['to_first']):
                continue

            # Ensure from_sub activity came before to_sub
            if row['from_first'] >= row['to_first']:
                continue

            time_gap = (row['to_first'] - row['from_last']).days

            # Filter by time gap constraints
            if MIN_TIME_GAP_DAYS <= time_gap <= MAX_TIME_GAP_DAYS:
                migrations.append({
                    'user': row['user'],
                    'from_sub': row['from_sub'],
                    'to_sub': row['to_sub'],
                    'time_gap_days': time_gap,
                    'migration_date': row['to_first'],
                    'from_activity': row.get('from_count', 0),
                    'to_activity': row.get('to_count', 0)
                })

        migration_df = pd.DataFrame(migrations)

        print(f"✓ Detected {len(migration_df)} valid migrations from {len(user_df)} raw records")

        return migration_df

    def calculate_flow_metrics(self, migrations=None) -> dict:
        """
        Aggregates migration data

        Returns:
            Dictionary with flow metrics:
            - total_users: users migrating A → B
            - avg_time_gap: average time gap in days
            - migration_velocity: migrations per month
        """
        if migrations is None:
            migrations = self.detect_migrations()

        if migrations.empty:
            return {}

        # Group by migration path (from_sub → to_sub)
        flow_groups = migrations.groupby(['from_sub', 'to_sub'])

        flows = {}

        for (from_sub, to_sub), group in flow_groups:
            flow_key = f"{from_sub}->{to_sub}"

            flows[flow_key] = {
                'from': from_sub,
                'to': to_sub,
                'total_users': len(group),
                'avg_time_gap': round(group['time_gap_days'].mean(), 1),
                'median_time_gap': round(group['time_gap_days'].median(), 1),
                'min_time_gap': int(group['time_gap_days'].min()),
                'max_time_gap': int(group['time_gap_days'].max()),
            }

            # Calculate migration velocity (migrations per month)
            if 'migration_date' in group.columns:
                date_range = (group['migration_date'].max() - group['migration_date'].min()).days
                if date_range > 0:
                    months = date_range / 30
                    flows[flow_key]['migration_velocity'] = round(len(group) / months, 2)
                else:
                    flows[flow_key]['migration_velocity'] = len(group)

        print(f"✓ Calculated metrics for {len(flows)} migration flows")

        return flows

    def build_network_graph(self, flows=None, min_threshold=None) -> dict:
        """
        Converts to force-graph format

        Args:
            flows: Flow metrics dictionary (from calculate_flow_metrics)
            min_threshold: Minimum number of users to show a connection

        Returns:
            {
                "nodes": [{id, name, size, category}],
                "links": [{source, target, value}]
            }
        """
        if flows is None:
            migrations = self.detect_migrations()
            flows = self.calculate_flow_metrics(migrations)

        if min_threshold is None:
            min_threshold = MIN_FLOW_THRESHOLD

        # Build nodes and links
        node_activity = defaultdict(int)
        links = []

        for flow_key, metrics in flows.items():
            if metrics['total_users'] < min_threshold:
                continue

            from_sub = metrics['from']
            to_sub = metrics['to']

            # Accumulate activity for node sizing
            node_activity[from_sub] += metrics['total_users']
            node_activity[to_sub] += metrics['total_users']

            # Create link
            links.append({
                'source': from_sub,
                'target': to_sub,
                'value': metrics['total_users'],
                'avg_time_gap': metrics['avg_time_gap'],
                'migration_velocity': metrics.get('migration_velocity', 0)
            })

        # Create nodes
        nodes = []
        for subreddit, activity in node_activity.items():
            # Determine category (if subreddit belongs to a known category)
            category = self._get_category(subreddit)

            nodes.append({
                'id': subreddit,
                'name': f"r/{subreddit}",
                'size': activity,
                'category': category
            })

        graph_data = {
            'nodes': nodes,
            'links': links
        }

        print(f"✓ Built network graph: {len(nodes)} nodes, {len(links)} links")

        return graph_data

    def _get_category(self, subreddit: str) -> str:
        """Determine which category a subreddit belongs to"""
        from config import CATEGORIES

        for category, subs in CATEGORIES.items():
            if subreddit.lower() in [s.lower() for s in subs]:
                return category

        return 'other'

    def identify_bridge_communities(self, graph=None) -> list:
        """
        Finds communities that connect multiple clusters

        Uses betweenness centrality to identify bridge subreddits.

        Returns:
            Ranked list of bridge subreddits with centrality scores
        """
        if graph is None:
            graph = self.build_network_graph()

        # Build NetworkX graph
        G = nx.DiGraph()

        for node in graph['nodes']:
            G.add_node(node['id'], **node)

        for link in graph['links']:
            G.add_edge(link['source'], link['target'], weight=link['value'])

        # Calculate betweenness centrality
        centrality = nx.betweenness_centrality(G, weight='weight')

        # Sort by centrality
        bridge_communities = [
            {
                'subreddit': node,
                'centrality': score,
                'category': G.nodes[node].get('category', 'other')
            }
            for node, score in sorted(centrality.items(), key=lambda x: x[1], reverse=True)
        ]

        print(f"✓ Identified {len(bridge_communities)} bridge communities")

        # Show top 10
        print("\n🌉 Top Bridge Communities:")
        for i, bridge in enumerate(bridge_communities[:10], 1):
            print(f"   {i}. r/{bridge['subreddit']} (centrality: {bridge['centrality']:.3f})")

        return bridge_communities

    def export_for_frontend(self, output_path: str, include_metrics=True, min_threshold=None):
        """
        Saves processed data as JSON for frontend consumption

        Args:
            output_path: Path to save JSON file
            include_metrics: Whether to include additional metrics
            min_threshold: Minimum number of users to show a connection
        """
        migrations = self.detect_migrations()
        flows = self.calculate_flow_metrics(migrations)
        graph = self.build_network_graph(flows, min_threshold=min_threshold)
        bridges = self.identify_bridge_communities(graph)

        export_data = {
            'graph': graph,
            'metadata': {
                'total_migrations': len(migrations),
                'unique_users': len(migrations['user'].unique()) if not migrations.empty else 0,
                'subreddit_count': len(graph['nodes']),
                'flow_count': len(graph['links']),
                'generated_at': datetime.now().isoformat()
            }
        }

        if include_metrics:
            export_data['flows'] = flows
            export_data['bridge_communities'] = bridges[:20]  # Top 20

            # Calculate summary statistics
            if not migrations.empty:
                export_data['summary_stats'] = {
                    'avg_migration_time': round(migrations['time_gap_days'].mean(), 1),
                    'median_migration_time': round(migrations['time_gap_days'].median(), 1),
                    'fastest_migration': int(migrations['time_gap_days'].min()),
                    'slowest_migration': int(migrations['time_gap_days'].max())
                }

        # Save to file
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)

        print(f"\n💾 Exported data to {output_path}")
        print(f"   File size: {len(json.dumps(export_data)) / 1024:.1f} KB")


def main():
    """Command-line interface for data processing"""
    parser = argparse.ArgumentParser(description='Process Reddit migration data')
    parser.add_argument(
        '--input',
        type=str,
        required=True,
        help='Input CSV file with raw migration data'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='../data/community_flows.json',
        help='Output JSON file path'
    )
    parser.add_argument(
        '--min-flow',
        type=int,
        default=MIN_FLOW_THRESHOLD,
        help='Minimum migrations to show a connection'
    )

    args = parser.parse_args()

    print(f"\n🔄 Processing migration data from {args.input}...")

    # Initialize processor
    processor = MigrationProcessor(data_path=args.input)

    # Process and export
    processor.export_for_frontend(args.output, min_threshold=args.min_flow)

    print("\n✓ Processing complete!\n")


if __name__ == '__main__':
    main()
