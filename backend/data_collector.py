"""
Reddit Migration Data Collector

Collects user posting history across subreddits to identify migration patterns.
Uses PRAW (Python Reddit API Wrapper) to scrape user activity.
"""
import praw
import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict
import time
import argparse
from config import (
    REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT,
    MAX_USERS_PER_SUB, TIME_WINDOW_DAYS, CATEGORIES, MIN_POSTS_THRESHOLD
)


class RedditMigrationCollector:
    """
    Collects user posting history across subreddits
    """

    def __init__(self, client_id=None, client_secret=None, user_agent=None):
        """Initialize PRAW Reddit instance"""
        self.reddit = praw.Reddit(
            client_id=client_id or REDDIT_CLIENT_ID,
            client_secret=client_secret or REDDIT_CLIENT_SECRET,
            user_agent=user_agent or REDDIT_USER_AGENT
        )
        self.reddit.read_only = True

    def get_seed_communities(self, category: str) -> list:
        """
        Returns predefined seed subreddits by category

        Args:
            category: 'fitness', 'tech', 'finance', 'gaming', 'creative', or 'all'

        Returns:
            List of subreddit names
        """
        if category == 'all':
            # Flatten all categories
            all_subs = []
            for subs in CATEGORIES.values():
                all_subs.extend(subs)
            return all_subs

        return CATEGORIES.get(category, [])

    def scrape_active_users(self, subreddit: str, limit=None) -> list:
        """
        Gets top N active users from a subreddit

        Args:
            subreddit: Name of the subreddit
            limit: Maximum number of users to return (default: MAX_USERS_PER_SUB)

        Returns:
            List of unique usernames
        """
        if limit is None:
            limit = MAX_USERS_PER_SUB

        users = set()

        try:
            sub = self.reddit.subreddit(subreddit)

            # Scrape from hot posts
            for post in sub.hot(limit=50):
                if post.author and not post.author.name.startswith('[deleted]'):
                    users.add(post.author.name)

                if len(users) >= limit:
                    break

            # If we need more users, check top posts from this month
            if len(users) < limit:
                for post in sub.top(time_filter='month', limit=50):
                    if post.author and not post.author.name.startswith('[deleted]'):
                        users.add(post.author.name)

                    if len(users) >= limit:
                        break

            print(f"✓ Found {len(users)} active users in r/{subreddit}")

        except Exception as e:
            print(f"✗ Error scraping r/{subreddit}: {str(e)}")

        # Add a small delay to respect rate limits
        time.sleep(1)

        return list(users)[:limit]

    def get_user_subreddit_history(self, username: str, time_window=None) -> dict:
        """
        Gets user's posting history across subreddits

        Args:
            username: Reddit username
            time_window: Number of days to look back (default: TIME_WINDOW_DAYS)

        Returns:
            Dict: {subreddit: {'post_count': int, 'first_post': timestamp, 'last_post': timestamp}}
        """
        if time_window is None:
            time_window = TIME_WINDOW_DAYS

        cutoff_date = datetime.now() - timedelta(days=time_window)
        subreddit_activity = defaultdict(lambda: {
            'post_count': 0,
            'first_post': None,
            'last_post': None
        })

        try:
            user = self.reddit.redditor(username)

            # Check submissions (posts)
            for submission in user.submissions.new(limit=200):
                post_date = datetime.fromtimestamp(submission.created_utc)

                if post_date < cutoff_date:
                    break

                subreddit = submission.subreddit.display_name.lower()
                activity = subreddit_activity[subreddit]

                activity['post_count'] += 1

                if activity['first_post'] is None or post_date < activity['first_post']:
                    activity['first_post'] = post_date

                if activity['last_post'] is None or post_date > activity['last_post']:
                    activity['last_post'] = post_date

            # Check comments
            for comment in user.comments.new(limit=200):
                comment_date = datetime.fromtimestamp(comment.created_utc)

                if comment_date < cutoff_date:
                    break

                subreddit = comment.subreddit.display_name.lower()
                activity = subreddit_activity[subreddit]

                activity['post_count'] += 1

                if activity['first_post'] is None or comment_date < activity['first_post']:
                    activity['first_post'] = comment_date

                if activity['last_post'] is None or comment_date > activity['last_post']:
                    activity['last_post'] = comment_date

        except Exception as e:
            print(f"  ✗ Error fetching history for u/{username}: {str(e)}")

        # Filter out subreddits with too few posts
        filtered_activity = {
            sub: data for sub, data in subreddit_activity.items()
            if data['post_count'] >= MIN_POSTS_THRESHOLD
        }

        return filtered_activity

    def build_migration_dataset(self, seed_subs: list, users_per_sub=None) -> pd.DataFrame:
        """
        Main orchestrator function

        Args:
            seed_subs: List of seed subreddit names
            users_per_sub: Number of users to sample per subreddit

        Returns:
            DataFrame with columns [user, from_sub, to_sub, from_first, from_last, to_first, to_last]
        """
        all_migrations = []
        processed_users = set()

        print(f"\n🚀 Starting data collection for {len(seed_subs)} subreddits...")
        print(f"   Time window: {TIME_WINDOW_DAYS} days")
        print(f"   Users per sub: {users_per_sub or MAX_USERS_PER_SUB}\n")

        for i, subreddit in enumerate(seed_subs, 1):
            print(f"[{i}/{len(seed_subs)}] Processing r/{subreddit}...")

            # Get active users from this subreddit
            users = self.scrape_active_users(subreddit, limit=users_per_sub)

            for user in users:
                if user in processed_users:
                    continue

                processed_users.add(user)

                # Get their cross-subreddit history
                history = self.get_user_subreddit_history(user)

                if len(history) < 2:
                    # User only active in one subreddit, no migration
                    continue

                # Identify potential migrations between subreddit pairs
                subreddits = list(history.keys())
                for from_sub in subreddits:
                    for to_sub in subreddits:
                        if from_sub == to_sub:
                            continue

                        from_data = history[from_sub]
                        to_data = history[to_sub]

                        # Check if there's a temporal pattern (from_sub activity before to_sub)
                        if from_data['first_post'] and to_data['first_post']:
                            all_migrations.append({
                                'user': user,
                                'from_sub': from_sub,
                                'to_sub': to_sub,
                                'from_first': from_data['first_post'],
                                'from_last': from_data['last_post'],
                                'to_first': to_data['first_post'],
                                'to_last': to_data['last_post'],
                                'from_count': from_data['post_count'],
                                'to_count': to_data['post_count']
                            })

                # Rate limiting
                time.sleep(0.5)

            print(f"  Total unique users processed: {len(processed_users)}\n")

        df = pd.DataFrame(all_migrations)

        print(f"\n✓ Data collection complete!")
        print(f"  Total migration records: {len(df)}")
        print(f"  Unique users: {len(processed_users)}")

        return df


def main():
    """Command-line interface for data collection"""
    parser = argparse.ArgumentParser(description='Collect Reddit migration data')
    parser.add_argument(
        '--category',
        type=str,
        default='fitness',
        help='Category of subreddits (fitness, tech, finance, gaming, creative, all)'
    )
    parser.add_argument(
        '--users',
        type=int,
        default=50,
        help='Number of users to sample per subreddit'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='../data/raw_user_posts.csv',
        help='Output file path'
    )

    args = parser.parse_args()

    # Initialize collector
    collector = RedditMigrationCollector()

    # Get seed communities
    seed_subs = collector.get_seed_communities(args.category)

    if not seed_subs:
        print(f"✗ Unknown category: {args.category}")
        print(f"  Available: {', '.join(CATEGORIES.keys())}, all")
        return

    # Collect data
    df = collector.build_migration_dataset(seed_subs, users_per_sub=args.users)

    # Save to CSV
    if not df.empty:
        df.to_csv(args.output, index=False)
        print(f"\n💾 Data saved to {args.output}")
    else:
        print("\n⚠️  No data collected. Check your Reddit API credentials.")


if __name__ == '__main__':
    main()
