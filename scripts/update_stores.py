import os, re, json, time
import requests

CLIENT_ID = os.environ["NAVER_CLIENT_ID"]
CLIENT_SECRET = os.environ["NAVER_CLIENT_SECRET"]

HEADERS = {
    "X-Naver-Client-Id": CLIENT_ID,
    "X-Naver-Client-Secret": CLIENT_SECRET,
}

KEYWORDS = [
    "두바이쫀득쿠키",
    "두바이 쿠키",
    "두바이 초콜릿 쿠키",
    "피스타치오 카다이프 쿠키",
    "카다이프 쿠키",
    "쫀득쿠키",
]

TARGET = 100

def clean_html(s: str) -> str:
    return re.sub(r"<.*?>", "", s or "").strip()

def district_from(addr: str) -> str:
    parts = (addr or "").split()
    if len(parts) >= 2 and parts[0].startswith("서울"):
        return parts[1]
    return ""

def search_local(query: str, start: int, display: int = 5):
    url = "https://openapi.naver.com/v1/search/local.json"
    params = {"query": query, "display": display, "start": start, "sort": "random"}
    r = requests.get(url, headers=HEADERS, params=params, timeout=15)
    r.raise_for_status()
    return r.json().get("items", [])

def try_parse_latlng(mapx, mapy):
    try:
        lng = float(mapx) / 1e7
        lat = float(mapy) / 1e7
        if 37.3 <= lat <= 37.8 and 126.7 <= lng <= 127.3:
            return round(lat, 6), round(lng, 6)
    except:
        pass
    return None

stores = []
seen = set()
next_id = 1

while len(stores) < TARGET:
    progressed = False

    for kw in KEYWORDS:
        for start in range(1, 100, 5):
            try:
                items = search_local(kw, start=start, display=5)
            except Exception:
                time.sleep(0.5)
                continue

            for it in items:
                name = clean_html(it.get("title", ""))
                address = (it.get("roadAddress") or it.get("address") or "").strip()

                if not address.startswith("서울"):
                    continue

                pos = try_parse_latlng(it.get("mapx"), it.get("mapy"))
                if not pos:
                    continue

                key = f"{name}|{address}"
                if key in seen:
                    continue
                seen.add(key)

                lat, lng = pos
                stores.append({
                    "id": next_id,
                    "name": name,
                    "address": address,
                    "district": district_from(address),
                    "lat": lat,
                    "lng": lng,
                    "status": "available",
                    "price": 5500,
                    "category": "dubai",
                    "rating": 4.6,
                    "distance": "",
                    "instagramHandle": "",
                })
                next_id += 1
                progressed = True

                print(f"Collected {len(stores)}/{TARGET}")

                if len(stores) >= TARGET:
                    break

            time.sleep(0.2)
            if len(stores) >= TARGET:
                break
        if len(stores) >= TARGET:
            break

    if not progressed:
        break

os.makedirs("public", exist_ok=True)
out_path = "public/stores.json"

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(stores, f, ensure_ascii=False, indent=2)

print(f"✅ wrote {len(stores)} stores to {out_path}")
