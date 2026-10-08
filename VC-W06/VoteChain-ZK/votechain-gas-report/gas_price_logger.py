import re
import requests
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime
import time

# ---------- CONFIGURATION ----------
ETHERSCAN_API_KEY = "NYEA3K5ZT7H2X1MXDPNBB3YC36PBGG8WU3"
GAS_REPORT_FILE = "gas_results.txt"          # output of forge test --gas-report
LOG_FILE = "gas_price_log.csv"               # historical log file
INTERVAL_MINUTES = 10                        # fetch interval (you can change to 5 or 15)
RUN_HOURS = 2                                # how long to run tracking loop

ETHERSCAN_GAS_API = f"https://api.etherscan.io/v2/api?chainid=1&module=gastracker&action=gasoracle&apikey={ETHERSCAN_API_KEY}"
ETH_PRICE_API = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
GWEI_TO_ETH = 1e-9

# ---------- STEP 1: LOAD FUNCTION GAS DATA ----------
with open(GAS_REPORT_FILE, "r", encoding="utf-8") as f:
    text = f.read()

pattern = r"\|\s*(\w+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|"
matches = re.findall(pattern, text)

if not matches:
    raise ValueError("No function gas data found. Make sure you exported forge gas report correctly.")

functions = [{"Function": m[0], "AvgGas": int(m[2])} for m in matches]
df_funcs = pd.DataFrame(functions)

# ---------- STEP 2: TRACK LOOP ----------
columns = ["Timestamp", "GasPrice(Gwei)", "ETHPrice(USD)"] + \
           [f"{fn}_USD" for fn in df_funcs["Function"]]

print(f"⏱️ Starting real-time tracker for {RUN_HOURS} hours "
      f"(interval = {INTERVAL_MINUTES} min)...")

for _ in range(int((RUN_HOURS * 60) / INTERVAL_MINUTES)):
    try:
        # Fetch live gas price
        gas_json = requests.get(ETHERSCAN_GAS_API).json()
        print("\n🔍 Full Etherscan API Response:")
        print(gas_json)

        gas_gwei = float(gas_json["result"]["ProposeGasPrice"]) if gas_json["status"] == "1" else 20.0

        # Fetch live ETH/USD
        eth_price_usd = requests.get(ETH_PRICE_API).json()["ethereum"]["usd"]

        print(f"💰 ETH Price: ${eth_price_usd}")
        # Compute cost per function
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        data_row = [timestamp, gas_gwei, eth_price_usd]

        for _, row in df_funcs.iterrows():
            gas_used = row["AvgGas"]
            tx_cost_usd = gas_used * gas_gwei * GWEI_TO_ETH * eth_price_usd
            print(f"💰 Transaction Cost: ${tx_cost_usd}")
            data_row.append(round(tx_cost_usd, 4))

        # Append to CSV log
        df_log = pd.DataFrame([data_row], columns=columns)
        df_log.to_csv(LOG_FILE, mode="a", index=False, header=not pd.io.common.file_exists(LOG_FILE))

        print(f"[{timestamp}] Gas={gas_gwei} Gwei | ETH=${eth_price_usd} | Logged ✅")

    except Exception as e:
        print("⚠️ Error during fetch:", e)

    time.sleep(INTERVAL_MINUTES * 60)

print("✅ Tracking finished. Data saved to:", LOG_FILE)

# ---------- STEP 3: VISUALIZE ----------
df = pd.read_csv(LOG_FILE)
df["Timestamp"] = pd.to_datetime(df["Timestamp"])

plt.figure(figsize=(10,5))
plt.plot(df["Timestamp"], df["GasPrice(Gwei)"], marker="o", color="orange", label="Gas Price (Gwei)")
plt.title("Real-Time Ethereum Gas Price Variation")
plt.xlabel("Time")
plt.ylabel("Gas Price (Gwei)")
plt.legend()
plt.tight_layout()
plt.savefig("gas_price_variation.png", dpi=300)
plt.show()

# Pick one example function (e.g., castVote) for cost trend
example_func = df_funcs["Function"].iloc[0]
col_name = f"{example_func}_USD"

plt.figure(figsize=(10,5))
plt.plot(df["Timestamp"], df[col_name], marker="o", color="seagreen",
         label=f"Cost of {example_func} (USD)")
plt.title(f"Transaction Cost Trend for {example_func}")
plt.xlabel("Time")
plt.ylabel("Cost (USD)")
plt.legend()
plt.tight_layout()
plt.savefig(f"{example_func}_cost_trend.png", dpi=300)
plt.show()
