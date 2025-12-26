import requests
import time
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1/shorten"
REDIRECT_URL = BASE_URL

def test_create_short_url():
    print("\n[1] Testing Create Short URL...")
    payload = {"url": "https://www.google.com"}
    try:
        response = requests.post(API_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        print(f"✅ Success: Created short code '{data['short_code']}' for {data['url']}")
        return data['short_code']
    except Exception as e:
        print(f"❌ Failed: {e}")
        return None

def test_get_metadata(short_code):
    print(f"\n[2] Testing Get Metadata for '{short_code}'...")
    try:
        response = requests.get(f"{API_URL}/{short_code}")
        response.raise_for_status()
        data = response.json()
        print(f"✅ Success: Retrieved metadata for {data['url']}")
    except Exception as e:
        print(f"❌ Failed: {e}")

def test_redirect(short_code):
    print(f"\n[3] Testing Redirect for '{short_code}'...")
    try:
        # allow_redirects=False to see the 301
        url = f"{REDIRECT_URL}/{short_code}"
        response = requests.get(url, allow_redirects=False)
        
        if response.status_code == 301:
            print(f"✅ Success: 301 Redirect received. Location: {response.headers.get('Location')}")
        else:
            print(f"❌ Failed: Expected 301, got {response.status_code}")
    except Exception as e:
        print(f"❌ Failed: {e}")

def test_rate_limiting(short_code):
    print(f"\n[4] Testing Rate Limiting (10 req/min)...")
    print("   Sending 12 requests...")
    try:
        for i in range(12):
            response = requests.get(f"{REDIRECT_URL}/{short_code}", allow_redirects=False)
            if response.status_code == 429:
                print(f"✅ Success: Request {i+1} was rate limited (429 Too Many Requests)")
                return
            if response.status_code != 301:
                print(f"⚠️ Warning: Request {i+1} got status {response.status_code}")
        print("❌ Failed: Rate limit not triggered after 12 requests")
    except Exception as e:
        print(f"❌ Failed: {e}")

def test_stats(short_code):
    print(f"\n[5] Testing Stats for '{short_code}'...")
    # Wait a bit for async background task to update DB
    time.sleep(1) 
    try:
        response = requests.get(f"{API_URL}/{short_code}/stats")
        response.raise_for_status()
        data = response.json()
        print(f"✅ Success: Access count is {data['access_count']}")
    except Exception as e:
        print(f"❌ Failed: {e}")

def test_update(short_code):
    print(f"\n[6] Testing Update for '{short_code}'...")
    new_url = "https://www.example.com"
    payload = {"url": new_url}
    try:
        response = requests.put(f"{API_URL}/{short_code}", json=payload)
        response.raise_for_status()
        data = response.json()
        print(f"✅ Success: Updated URL to {data['url']}")
        
        # Verify cache invalidation/update
        check_resp = requests.get(f"{REDIRECT_URL}/{short_code}", allow_redirects=False)
        if check_resp.headers.get('Location') == new_url:
             print(f"✅ Success: Redirect updated to {new_url}")
        else:
             print(f"❌ Failed: Redirect still pointing to old URL or error")

    except Exception as e:
        print(f"❌ Failed: {e}")

def test_delete(short_code):
    print(f"\n[7] Testing Delete for '{short_code}'...")
    try:
        response = requests.delete(f"{API_URL}/{short_code}")
        if response.status_code == 204:
            print("✅ Success: Deleted URL")
        else:
            print(f"❌ Failed: Expected 204, got {response.status_code}")
            return

        # Verify it's gone
        check_resp = requests.get(f"{REDIRECT_URL}/{short_code}", allow_redirects=False)
        if check_resp.status_code == 404:
            print("✅ Success: Redirect returns 404")
        else:
             print(f"❌ Failed: Redirect returned {check_resp.status_code} after delete")
             
    except Exception as e:
        print(f"❌ Failed: {e}")

if __name__ == "__main__":
    print("🚀 Starting API Verification Verification...")
    print("Ensure Docker containers are running (docker-compose up)")
    
    # Wait for service availability check could be here, but assuming it's up.
    
    code = test_create_short_url()
    if code:
        test_get_metadata(code)
        test_redirect(code)
        test_stats(code) # Should be at least 1
        test_update(code)
        test_delete(code)
        
        # Run rate limiting LAST so we don't get 429 blocks for previous functional tests
        test_rate_limiting(code)
        
    print("\n🏁 Validation Complete.")
