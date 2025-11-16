"""
Configuration settings for Reddit Migration Flow Analysis
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Reddit API Credentials
REDDIT_CLIENT_ID = os.getenv('REDDIT_CLIENT_ID', '')
REDDIT_CLIENT_SECRET = os.getenv('REDDIT_CLIENT_SECRET', '')
REDDIT_USER_AGENT = os.getenv('REDDIT_USER_AGENT', 'reddit_migration_analyzer_v1.0')

# Data collection parameters
MAX_USERS_PER_SUB = int(os.getenv('MAX_USERS_PER_SUB', 100))
TIME_WINDOW_DAYS = int(os.getenv('TIME_WINDOW_DAYS', 90))
MIN_POSTS_THRESHOLD = 3  # Minimum posts to count as "active"

# Migration detection
MIN_TIME_GAP_DAYS = 7    # Minimum gap to count as migration
MAX_TIME_GAP_DAYS = 180  # Maximum gap to still be relevant

# Seed subreddit categories (expandable)
CATEGORIES = {
    'fitness': [
        'fitness', 'loseit', 'keto', 'intermittentfasting',
        'bodyweightfitness', 'xxfitness', 'gainit', 'running'
    ],
    'tech': [
        'learnprogramming', 'webdev', 'reactjs', 'python',
        'javascript', 'programming', 'coding', 'cscareerquestions'
    ],
    'finance': [
        'personalfinance', 'investing', 'stocks', 'cryptocurrency',
        'financialindependence', 'wallstreetbets', 'dividends', 'options'
    ],
    'gaming': [
        'gaming', 'pcgaming', 'ps5', 'xbox', 'nintendo',
        'games', 'truegaming', 'patientgamers'
    ],
    'creative': [
        'art', 'design', 'photography', 'music',
        'writing', 'learnart', 'musicproduction', 'digitalart'
    ]
}

# Visualization settings
MIN_FLOW_THRESHOLD = 5  # Minimum migrations to show a connection
