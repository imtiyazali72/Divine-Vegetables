import datetime
from app.core.config import settings

def is_order_window_open(dt: datetime.datetime = None) -> bool:
    if dt is None:
        dt = datetime.datetime.now()
        
    hour = dt.hour
    minute = dt.minute
    
    # 22:00 (10:00 PM) to 23:59 (11:59 PM) OR 00:00 (12:00 AM) to 02:30 AM
    if hour >= settings.CUTOFF_START_HOUR:  # >= 22 (10 PM)
        return True
    if hour < settings.CUTOFF_END_HOUR:     # < 2 (12 AM, 1 AM)
        return True
    if hour == settings.CUTOFF_END_HOUR and minute <= settings.CUTOFF_END_MINUTE: # 2:00 AM to 2:30 AM
        return True
        
    return False

def get_cutoff_status(dt: datetime.datetime = None) -> dict:
    if dt is None:
        dt = datetime.datetime.now()
        
    open_status = is_order_window_open(dt)
    
    if open_status:
        # Calculate exact seconds remaining until 2:30 AM
        now_seconds = dt.hour * 3600 + dt.minute * 60 + dt.second
        if dt.hour >= 22:
            closing_seconds = (26 * 3600) + (30 * 60)  # 2:30 AM next day
        else:
            closing_seconds = (2 * 3600) + (30 * 60)   # 2:30 AM today
            
        seconds_left = max(0, closing_seconds - now_seconds)
        time_left_mins = seconds_left // 60
        hours_left = time_left_mins // 60
        mins_left = time_left_mins % 60
        
        target_dt = dt.replace(hour=2, minute=30, second=0, microsecond=0)
        if dt.hour >= 22:
            target_dt += datetime.timedelta(days=1)
            
        return {
            "is_open": True,
            "message": f"Nightly Order Window Active! Closes at 2:30 AM.",
            "time_remaining": f"{hours_left}h {mins_left}m",
            "time_remaining_minutes": time_left_mins,
            "seconds_remaining": seconds_left,
            "target_timestamp": target_dt.isoformat(),
            "window_start": "10:00 PM",
            "window_end": "2:30 AM"
        }
    else:
        return {
            "is_open": False,
            "message": "Ordering is closed. Nightly order window is 10:00 PM to 2:30 AM.",
            "time_remaining": "Closed",
            "time_remaining_minutes": 0,
            "seconds_remaining": 0,
            "target_timestamp": None,
            "window_start": "10:00 PM",
            "window_end": "2:30 AM"
        }

