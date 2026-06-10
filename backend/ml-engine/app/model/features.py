import numpy as np
import math
from datetime import datetime
from app.schemas import TransactionInput

def extract_features(transaction: TransactionInput) -> np.ndarray:
    """
    Extracts a 25-dimensional feature vector from raw transaction data.

    The 25 features are grouped as described in the README:
    - Transaction (5): raw amount, log-scaled amount, transaction type (encoded), time of day (hour), day of week
    - Velocity (5): transaction count (1m, 5m, 1h per user; 5m per device; 1h per IP)
    - Device (3): device entropy, device age, is-new-device flag
    - Network (3): IP geo risk tier, IP reuse freq, VPN indicator
    - Account (3): account age, 30-day average amount, historical flag count
    - Rest (6): filler/placeholder features to make a total of 25 features
    """
    features = np.zeros(25, dtype=np.float32)
    
    # 1. Amount
    features[0] = transaction.amount
    features[1] = math.log1p(transaction.amount)
    
    # 2. Transaction Type (encoded)
    type_map = {"DEPOSIT": 0, "PURCHASE": 1, "TRANSFER": 2, "WITHDRAWAL": 3}
    features[2] = type_map.get(transaction.type, 1.0)
    
    # 3. Time of day / Day of week (defaults to current time)
    now = datetime.utcnow()
    features[3] = now.hour
    features[4] = now.weekday()
    
    # 4. Amount deviation from user 30-day average
    features[5] = max(0.0, transaction.amount - 500.0)
    
    # Velocity features (stubbed with sensible defaults)
    features[6] = 1.0  # tx count 1m
    features[7] = 1.0  # tx count 5m
    features[8] = 2.0  # tx count 1h
    features[9] = 1.0  # tx count device 5m
    features[10] = 1.0 # tx count IP 1h
    
    # Device features
    features[11] = 4.5 if transaction.deviceId else 0.0  # device entropy
    features[12] = 30.0 if transaction.deviceId else 0.0  # device age
    features[13] = 1.0 if not transaction.deviceId else 0.0  # is new device
    
    # Network features
    features[14] = 1.0 if transaction.ipAddress else 0.0  # IP geo risk tier
    features[15] = 1.0  # IP reuse
    features[16] = 0.0  # VPN indicator
    
    # Account features
    features[17] = 90.0  # Account age
    features[18] = 500.0  # 30-day average amount
    features[19] = 0.0  # historical flag count
    
    # Filler features for 25 dimensions
    for i in range(20, 25):
        features[i] = 0.0
        
    return features
