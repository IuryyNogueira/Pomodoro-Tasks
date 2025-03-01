import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    HG_API_KEY = os.getenv('HG_API_KEY')
    DATA_FILE = os.path.join(os.path.abspath(os.path.dirname(__file__)), '../data/tasks.json')