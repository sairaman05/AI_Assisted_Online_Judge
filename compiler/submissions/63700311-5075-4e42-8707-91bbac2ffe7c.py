# Write your Python solution here
def solve():
    import ast

    missions = ast.literal_eval(" ".join(lines))

    missions.sort(key=lambda x: x[1])

    count = 0
    last_end = -1

    for start, end in missions:
        if start > last_end:
            count += 1
            last_end = end

    print(count)


import sys
lines = sys.stdin.read().split()
if lines:
    solve()