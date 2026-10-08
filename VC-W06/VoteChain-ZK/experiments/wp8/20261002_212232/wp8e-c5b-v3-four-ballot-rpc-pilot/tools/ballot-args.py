import json
import sys

input_path = sys.argv[1]
proof_path = sys.argv[2]

with open(input_path, encoding="utf-8") as f:
    x = json.load(f)

with open(proof_path, encoding="utf-8") as f:
    p = json.load(f)

a = [
    p["pi_a"][0],
    p["pi_a"][1]
]

# snarkjs G2 -> Solidity verifier coordinate convention.
b = [
    [
        p["pi_b"][0][1],
        p["pi_b"][0][0]
    ],
    [
        p["pi_b"][1][1],
        p["pi_b"][1][0]
    ]
]

c = [
    p["pi_c"][0],
    p["pi_c"][1]
]

def arr(v):
    return "[" + ",".join(
        str(z) for z in v
    ) + "]"

def arr2(v):
    return "[" + ",".join(
        arr(z) for z in v
    ) + "]"

print(arr(a))
print(arr2(b))
print(arr(c))
print(str(x["nullifier"]))
print(arr(x["Rx"]))
print(arr(x["Ry"]))
print(arr(x["Sx"]))
print(arr(x["Sy"]))
