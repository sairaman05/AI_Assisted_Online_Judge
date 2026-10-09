import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import os

os.makedirs('report_assets', exist_ok=True)

plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']

def draw_browser_chrome(ax, title="FIASCOde — Autonomous Online Judge", url="http://localhost:5173/"):
    # Window header
    ax.add_patch(patches.Rectangle((0, 8.4), 14.4, 0.6, facecolor='#1e293b', edgecolor='none'))
    # Window buttons
    ax.add_patch(patches.Circle((0.35, 8.7), 0.1, facecolor='#ef4444'))
    ax.add_patch(patches.Circle((0.65, 8.7), 0.1, facecolor='#f59e0b'))
    ax.add_patch(patches.Circle((0.95, 8.7), 0.1, facecolor='#10b981'))
    # Address bar
    ax.add_patch(patches.FancyBboxPatch((2.0, 8.48), 10.4, 0.42, boxstyle="round,pad=0.03,rounding_size=0.1",
                                        facecolor='#0f172a', edgecolor='#334155', linewidth=1))
    ax.text(2.3, 8.68, f"🔒  {url}", fontsize=8.5, color='#94a3b8', va='center')
    ax.text(7.2, 8.7, title, fontsize=8.5, color='#cbd5e1', ha='center', va='center')

def draw_navbar(ax, active_tab="Problems"):
    # Navbar background
    ax.add_patch(patches.Rectangle((0, 7.65), 14.4, 0.75, facecolor='#090d16', edgecolor='#1e293b', linewidth=1))
    # Brand logo
    ax.text(0.6, 8.02, "⚡ FIASCOde", fontsize=13, fontweight='bold', color='#38bdf8', va='center')
    ax.add_patch(patches.FancyBboxPatch((2.3, 7.85), 1.0, 0.35, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#3b82f6' if active_tab=="Problems" else '#1e293b', edgecolor='none'))
    ax.text(2.8, 8.02, "Problems", fontsize=8.5, fontweight='bold' if active_tab=="Problems" else 'normal',
            color='#ffffff' if active_tab=="Problems" else '#94a3b8', ha='center', va='center')
    
    tabs = [("Contests", 3.7), ("Leaderboard", 4.9), ("Interview Prep", 6.3), ("AI Hub", 7.7), ("Admin", 8.8)]
    for tab, x in tabs:
        is_act = (active_tab == tab)
        if is_act:
            ax.add_patch(patches.FancyBboxPatch((x-0.4, 7.85), 1.1, 0.35, boxstyle="round,pad=0.02,rounding_size=0.08",
                                                facecolor='#3b82f6', edgecolor='none'))
        ax.text(x+0.15, 8.02, tab, fontsize=8.5, fontweight='bold' if is_act else 'normal',
                color='#ffffff' if is_act else '#94a3b8', ha='center', va='center')
    
    # User pill
    ax.add_patch(patches.FancyBboxPatch((12.4, 7.82), 1.6, 0.42, boxstyle="round,pad=0.02,rounding_size=0.1",
                                        facecolor='#1e293b', edgecolor='#38bdf8', linewidth=1))
    ax.text(13.2, 8.02, "👤 vignesh.dev", fontsize=8, color='#38bdf8', ha='center', va='center')

# 1. Homepage UI
def create_ui_homepage():
    fig, ax = plt.subplots(figsize=(14.4, 9.0), dpi=300)
    ax.set_facecolor('#0b0f19')
    fig.patch.set_facecolor('#0b0f19')
    draw_browser_chrome(ax, "FIASCOde — Autonomous Online Judge", "http://localhost:5173/")
    draw_navbar(ax, active_tab="Home")

    # Hero Badge
    ax.add_patch(patches.FancyBboxPatch((4.7, 6.9), 5.0, 0.45, boxstyle="round,pad=0.04,rounding_size=0.2",
                                        facecolor='#1e1b4b', edgecolor='#6366f1', linewidth=1.5))
    ax.text(7.2, 7.12, "✨ Next-Gen Competitive Programming & LangGraph Agents", fontsize=8.5, color='#a5b4fc', ha='center', va='center')

    # Hero Title
    ax.text(7.2, 6.2, "Code. Compete. Debug Autonomously.", fontsize=22, fontweight='bold', color='#f8fafc', ha='center')
    ax.text(7.2, 5.5, "The first full-stack online judge integrated with Model Context Protocol (MCP)\nand multi-step hypothesis-driven AI debugging agents.", 
            fontsize=10.5, color='#94a3b8', ha='center', linespacing=1.4)

    # CTA Buttons
    ax.add_patch(patches.FancyBboxPatch((4.6, 4.5), 2.3, 0.65, boxstyle="round,pad=0.04,rounding_size=0.12",
                                        facecolor='#2563eb', edgecolor='#38bdf8', linewidth=1))
    ax.text(5.75, 4.82, "⚡ Explore Problems", fontsize=9.5, fontweight='bold', color='#ffffff', ha='center', va='center')

    ax.add_patch(patches.FancyBboxPatch((7.4, 4.5), 2.3, 0.65, boxstyle="round,pad=0.04,rounding_size=0.12",
                                        facecolor='#1e293b', edgecolor='#475569', linewidth=1))
    ax.text(8.55, 4.82, "🏆 Enter Live Contest", fontsize=9.5, fontweight='bold', color='#e2e8f0', ha='center', va='center')

    # Feature Cards
    cards = [
        (0.8, 1.2, 3.8, 2.7, "🤖 Autonomous Debugging", "Closed-loop LangGraph state machine diagnosing logical bugs, syntax errors, and generating unified diff patches with sandboxed verification.", "#3b82f6"),
        (5.3, 1.2, 3.8, 2.7, "🐳 Isolated Sandboxing", "High-throughput execution of C++, Python 3, and Java 21 inside Alpine Linux Docker containers with 256MB RAM and 6000ms CPU quota.", "#10b981"),
        (9.8, 1.2, 3.8, 2.7, "👑 AI Contest Sentinel", "Continuous telemetry monitoring, anomaly detection, difficulty spike classification, and Human-in-the-Loop admin governance.", "#ec4899")
    ]

    for x, y, w, h, title, desc, col in cards:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.15",
                                            facecolor='#111827', edgecolor=col, linewidth=1.5))
        ax.text(x + 0.3, y + h - 0.5, title, fontsize=11, fontweight='bold', color='#f8fafc', va='center')
        ax.text(x + 0.3, y + 1.1, desc, fontsize=8.5, color='#9ca3af', va='center', linespacing=1.35)

    ax.set_xlim(0, 14.4)
    ax.set_ylim(0, 9.0)
    ax.axis('off')
    plt.tight_layout()
    plt.savefig('report_assets/ui_homepage.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Created ui_homepage.png")

# 2. Problem Catalog UI
def create_ui_problem_catalog():
    fig, ax = plt.subplots(figsize=(14.4, 9.0), dpi=300)
    ax.set_facecolor('#0b0f19')
    fig.patch.set_facecolor('#0b0f19')
    draw_browser_chrome(ax, "Problem Catalog — FIASCOde", "http://localhost:5173/problems")
    draw_navbar(ax, active_tab="Problems")

    # Header & Search
    ax.text(1.0, 7.1, "Algorithmic Problem Catalog", fontsize=15, fontweight='bold', color='#f8fafc')
    ax.text(1.0, 6.75, "Select a challenge, test your logic in the sandbox, or activate AI agent debugging.", fontsize=9, color='#94a3b8')

    # Search and Filter Bars
    ax.add_patch(patches.FancyBboxPatch((1.0, 6.05), 5.5, 0.45, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#1e293b', edgecolor='#334155', linewidth=1))
    ax.text(1.2, 6.27, "🔍  Search problems by title, tags, or concept...", fontsize=8.5, color='#64748b', va='center')

    # Filter Pills
    pills = [("All Difficulties", 7.0, '#3b82f6'), ("Easy (12)", 8.5, '#10b981'), ("Medium (24)", 9.7, '#f59e0b'), ("Hard (8)", 11.1, '#ef4444')]
    for text, px, pcol in pills:
        ax.add_patch(patches.FancyBboxPatch((px, 6.05), 1.15, 0.45, boxstyle="round,pad=0.02,rounding_size=0.08",
                                            facecolor='#1e293b', edgecolor=pcol, linewidth=1))
        ax.text(px + 0.57, 6.27, text, fontsize=7.5, color=pcol, ha='center', va='center')

    # Problems Table Header
    ax.add_patch(patches.Rectangle((1.0, 5.35), 12.4, 0.45, facecolor='#1e293b', edgecolor='none'))
    ax.text(1.4, 5.57, "Status", fontsize=8.5, fontweight='bold', color='#94a3b8', va='center')
    ax.text(2.6, 5.57, "Problem Title", fontsize=8.5, fontweight='bold', color='#94a3b8', va='center')
    ax.text(7.2, 5.57, "Category / Tags", fontsize=8.5, fontweight='bold', color='#94a3b8', va='center')
    ax.text(9.8, 5.57, "Difficulty", fontsize=8.5, fontweight='bold', color='#94a3b8', va='center')
    ax.text(11.6, 5.57, "Acceptance Rate", fontsize=8.5, fontweight='bold', color='#94a3b8', va='center')

    # Problem Rows
    rows = [
        ("✓ Solved", "#10b981", "1. Two Sum Target Index", "Arrays, Hash Table", "Easy", "#10b981", "78.4% (1,420 solves)"),
        ("✓ Solved", "#10b981", "2. Longest Substring Without Repeating", "Sliding Window, String", "Medium", "#f59e0b", "54.2% (980 solves)"),
        ("● Attempted", "#f59e0b", "3. Median of Two Sorted Arrays", "Binary Search, Divide & Conquer", "Hard", "#ef4444", "31.8% (410 solves)"),
        ("○ Unsolved", "#64748b", "4. Container With Most Water", "Two Pointers, Greedy", "Medium", "#f59e0b", "62.1% (820 solves)"),
        ("○ Unsolved", "#64748b", "5. Regular Expression Matching", "Dynamic Programming, Recursion", "Hard", "#ef4444", "24.6% (290 solves)"),
        ("✓ Solved", "#10b981", "6. Valid Parentheses Stack", "Stack, String Parsing", "Easy", "#10b981", "88.1% (1,890 solves)"),
        ("○ Unsolved", "#64748b", "7. Merge K Sorted Linked Lists", "Heap / Priority Queue, LinkedList", "Hard", "#ef4444", "38.5% (512 solves)")
    ]

    y = 4.7
    for status, scol, title, tags, diff, dcol, acc in rows:
        ax.add_patch(patches.Rectangle((1.0, y), 12.4, 0.55, facecolor='#111827' if int(y*10)%2==0 else '#0d131f', edgecolor='#1f2937', linewidth=0.5))
        ax.text(1.4, y + 0.27, status, fontsize=8, color=scol, va='center')
        ax.text(2.6, y + 0.27, title, fontsize=8.5, fontweight='bold', color='#f8fafc', va='center')
        ax.text(7.2, y + 0.27, tags, fontsize=8, color='#94a3b8', va='center')
        
        # Difficulty pill
        ax.add_patch(patches.FancyBboxPatch((9.7, y + 0.1), 0.9, 0.35, boxstyle="round,pad=0.02,rounding_size=0.08",
                                            facecolor='#1e293b', edgecolor=dcol, linewidth=1))
        ax.text(10.15, y + 0.27, diff, fontsize=7.5, color=dcol, ha='center', va='center')
        
        ax.text(11.6, y + 0.27, acc, fontsize=8, color='#cbd5e1', va='center')
        y -= 0.6

    ax.set_xlim(0, 14.4)
    ax.set_ylim(0, 9.0)
    ax.axis('off')
    plt.tight_layout()
    plt.savefig('report_assets/ui_problem_catalog.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Created ui_problem_catalog.png")

# 3. Dual-Pane Code Editor UI
def create_ui_code_editor():
    fig, ax = plt.subplots(figsize=(14.4, 9.0), dpi=300)
    ax.set_facecolor('#0b0f19')
    fig.patch.set_facecolor('#0b0f19')
    draw_browser_chrome(ax, "Two Sum — Code Editor & AI Sandbox", "http://localhost:5173/editor/problem-1")
    draw_navbar(ax, active_tab="Problems")

    # Left Panel: Problem Statement
    ax.add_patch(patches.FancyBboxPatch((0.5, 0.4), 6.5, 7.1, boxstyle="round,pad=0.04,rounding_size=0.1",
                                        facecolor='#111827', edgecolor='#1f2937', linewidth=1))
    
    # Left Header
    ax.text(0.8, 7.15, "1. Two Sum Target Index", fontsize=13, fontweight='bold', color='#f8fafc', va='center')
    ax.add_patch(patches.FancyBboxPatch((4.5, 7.0), 0.7, 0.32, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#064e3b', edgecolor='#10b981', linewidth=1))
    ax.text(4.85, 7.16, "Easy", fontsize=7.5, color='#34d399', ha='center', va='center')
    
    ax.add_patch(patches.FancyBboxPatch((5.4, 7.0), 1.3, 0.32, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#312e81', edgecolor='#818cf8', linewidth=1))
    ax.text(6.05, 7.16, "💡 AI Hint (2 Left)", fontsize=7.5, color='#a5b4fc', ha='center', va='center')

    # Description text
    desc_lines = [
        "Given an array of integers nums and an integer target, return indices",
        "of the two numbers such that they add up to target.",
        "",
        "You may assume that each input would have exactly one solution,",
        "and you may not use the same element twice.",
        "",
        "Example 1:",
        "  Input: nums = [2,7,11,15], target = 9",
        "  Output: [0,1]  (Because nums[0] + nums[1] == 9)",
        "",
        "Example 2:",
        "  Input: nums = [3,2,4], target = 6",
        "  Output: [1,2]",
        "",
        "Constraints:",
        "  • 2 <= nums.length <= 10^4",
        "  • -10^9 <= nums[i] <= 10^9",
        "  • Only one valid answer exists."
    ]
    dy = 6.6
    for line in desc_lines:
        col = '#38bdf8' if 'Example' in line or 'Constraints' in line else ('#cbd5e1' if 'Output:' in line or 'Input:' in line else '#9ca3af')
        fw = 'bold' if 'Example' in line or 'Constraints' in line else 'normal'
        ax.text(0.8, dy, line, fontsize=8, color=col, fontweight=fw, va='center')
        dy -= 0.3

    # Right Panel: Code Editor
    ax.add_patch(patches.FancyBboxPatch((7.2, 0.4), 6.7, 7.1, boxstyle="round,pad=0.04,rounding_size=0.1",
                                        facecolor='#0f172a', edgecolor='#1f2937', linewidth=1))

    # Right Header (Language Selector & Controls)
    ax.add_patch(patches.FancyBboxPatch((7.5, 7.0), 1.5, 0.35, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#1e293b', edgecolor='#475569', linewidth=1))
    ax.text(8.25, 7.17, "C++ (G++ 14) ▼", fontsize=8, color='#f8fafc', ha='center', va='center')

    # AI Debug Button (Hero Trigger)
    ax.add_patch(patches.FancyBboxPatch((9.2, 7.0), 1.9, 0.35, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#831843', edgecolor='#f43f5e', linewidth=1))
    ax.text(10.15, 7.17, "🤖 AI Auto-Debug", fontsize=8, fontweight='bold', color='#fda4af', ha='center', va='center')

    # Run and Submit Buttons
    ax.add_patch(patches.FancyBboxPatch((11.3, 7.0), 1.0, 0.35, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#1e293b', edgecolor='#38bdf8', linewidth=1))
    ax.text(11.8, 7.17, "▶ Run", fontsize=8, color='#38bdf8', ha='center', va='center')

    ax.add_patch(patches.FancyBboxPatch((12.5, 7.0), 1.2, 0.35, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#16a34a', edgecolor='#22c55e', linewidth=1))
    ax.text(13.1, 7.17, "Submit 🚀", fontsize=8, fontweight='bold', color='#ffffff', ha='center', va='center')

    # Code Editor Body (Simulated Monaco Editor)
    ax.add_patch(patches.Rectangle((7.4, 2.3), 6.3, 4.5, facecolor='#090d16', edgecolor='#1e293b', linewidth=1))
    
    code_lines = [
        "1  #include <vector>",
        "2  #include <unordered_map>",
        "3  using namespace std;",
        "4  ",
        "5  class Solution {",
        "6  public:",
        "7      vector<int> twoSum(vector<int>& nums, int target) {",
        "8          unordered_map<int, int> seen;",
        "9          for (int i = 0; i < nums.size(); i++) {",
        "10             int complement = target - nums[i];",
        "11             if (seen.find(complement) != seen.end()) {",
        "12                 return {seen[complement], i};",
        "13             }",
        "14             seen[nums[i]] = i;",
        "15         }",
        "16         return {};",
        "17     }",
        "18 };"
    ]
    cy = 6.55
    for cline in code_lines:
        ax.text(7.6, cy, cline, fontsize=7.5, color='#38bdf8' if 'include' in cline else ('#f43f5e' if 'complement' in cline else '#cbd5e1'), va='center')
        cy -= 0.23

    # Output Console Tab
    ax.add_patch(patches.Rectangle((7.4, 0.6), 6.3, 1.6, facecolor='#030712', edgecolor='#1e293b', linewidth=1))
    ax.text(7.6, 1.95, "Console Output  |  Status: ✓ Accepted (AC)  |  Time: 3ms  |  Memory: 10.4MB", fontsize=7.5, fontweight='bold', color='#10b981', va='center')
    ax.text(7.6, 1.45, "Testcase 1: Input: [2,7,11,15], target=9 ➔ Expected: [0,1] ➔ Actual: [0,1] (PASS)", fontsize=7, color='#9ca3af', va='center')
    ax.text(7.6, 1.15, "Testcase 2: Input: [3,2,4], target=6      ➔ Expected: [1,2] ➔ Actual: [1,2] (PASS)", fontsize=7, color='#9ca3af', va='center')
    ax.text(7.6, 0.85, "Testcase 3: Input: [3,3], target=6        ➔ Expected: [0,1] ➔ Actual: [0,1] (PASS)", fontsize=7, color='#9ca3af', va='center')

    ax.set_xlim(0, 14.4)
    ax.set_ylim(0, 9.0)
    ax.axis('off')
    plt.tight_layout()
    plt.savefig('report_assets/ui_code_editor.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Created ui_code_editor.png")

# 4. Debugging Modal & Unified Diff UI
def create_ui_debugging_modal():
    fig, ax = plt.subplots(figsize=(14.4, 9.0), dpi=300)
    ax.set_facecolor('#050811')
    fig.patch.set_facecolor('#050811')
    
    # Backdrop shadow
    ax.add_patch(patches.FancyBboxPatch((1.2, 0.6), 12.0, 7.8, boxstyle="round,pad=0.08,rounding_size=0.15",
                                        facecolor='#0f172a', edgecolor='#6366f1', linewidth=2))

    # Modal Header
    ax.text(1.6, 8.0, "🤖 Autonomous Debugging Agent — Diagnosis & Patch Report", fontsize=13, fontweight='bold', color='#f8fafc', va='center')
    ax.add_patch(patches.FancyBboxPatch((10.4, 7.8), 2.4, 0.38, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#064e3b', edgecolor='#10b981', linewidth=1))
    ax.text(11.6, 8.0, "Verified in Docker (3 Iterations)", fontsize=7.5, color='#34d399', ha='center', va='center')

    # Root Cause Diagnostic Card
    ax.add_patch(patches.FancyBboxPatch((1.6, 6.2), 11.2, 1.35, boxstyle="round,pad=0.04,rounding_size=0.1",
                                        facecolor='#1e293b', edgecolor='#38bdf8', linewidth=1))
    ax.text(1.9, 7.2, "📌 Root Cause Diagnosis: Off-By-One Boundary & Hash Map Key Collision", fontsize=9.5, fontweight='bold', color='#38bdf8', va='center')
    ax.text(1.9, 6.75, "Failure Category: Logical Bug / Wrong Answer (WA)  |  Confidence Score: 98.4%", fontsize=8, color='#a5b4fc', va='center')
    ax.text(1.9, 6.4, "The original loop inserted the current element into the hash table before checking for the complement,\ncausing duplicate single-element collisions on testcases where target = 2 * nums[i].", fontsize=7.5, color='#cbd5e1', va='center', linespacing=1.2)

    # Hypothesis Execution Timeline
    ax.text(1.6, 5.85, "🔬 Agentic Hypothesis & Diagnostic Timeline", fontsize=10, fontweight='bold', color='#f8fafc', va='center')
    
    steps = [
        (1.6, 4.7, 3.5, 0.95, "Iteration 1: Syntax / Compile", "Tested AST validity. Result: No compilation syntax errors detected.", "#64748b"),
        (5.45, 4.7, 3.5, 0.95, "Iteration 2: Array Index Bounds", "Executed synthetic test with len=1. Out of bounds ruled out.", "#64748b"),
        (9.3, 4.7, 3.5, 0.95, "Iteration 3: Self-Collision Bug", "Synthetic test: nums=[3,3], target=6. Reproduced collision! (CONFIRMED)", "#10b981")
    ]
    for x, y, w, h, stitle, sdesc, scol in steps:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.04,rounding_size=0.08",
                                            facecolor='#1e293b', edgecolor=scol, linewidth=1.5))
        ax.text(x + 0.15, y + h - 0.25, stitle, fontsize=8, fontweight='bold', color='#f8fafc', va='center')
        ax.text(x + 0.15, y + 0.3, sdesc, fontsize=6.8, color='#cbd5e1', va='center', linespacing=1.2)

    # Unified Code Diff Viewer
    ax.text(1.6, 4.3, "📝 Synthesized Candidate Patch (Unified Diff)", fontsize=10, fontweight='bold', color='#f8fafc', va='center')
    ax.add_patch(patches.Rectangle((1.6, 1.4), 11.2, 2.7, facecolor='#090d16', edgecolor='#1e293b', linewidth=1))

    diff_lines = [
        ("@@ -9,7 +9,7 @@ vector<int> twoSum(vector<int>& nums, int target) {", '#818cf8'),
        ("      for (int i = 0; i < nums.size(); i++) {", '#cbd5e1'),
        ("-         seen[nums[i]] = i;  // BUG: Inserted before checking complement", '#f87171'),
        ("-         int complement = target - nums[i];", '#f87171'),
        ("-         if (seen.find(complement) != seen.end()) return {seen[complement], i};", '#f87171'),
        ("+         int complement = target - nums[i];", '#4ade80'),
        ("+         if (seen.find(complement) != seen.end()) return {seen[complement], i};", '#4ade80'),
        ("+         seen[nums[i]] = i;  // FIX: Insert only after validating complement", '#4ade80'),
        ("      }", '#cbd5e1'),
        ("      return {};", '#cbd5e1')
    ]
    dy = 3.85
    for line, lcol in diff_lines:
        bg = '#3b111a' if line.startswith('-') else ('#052e16' if line.startswith('+') else 'none')
        if bg != 'none':
            ax.add_patch(patches.Rectangle((1.65, dy - 0.1), 11.1, 0.22, facecolor=bg, edgecolor='none'))
        ax.text(1.8, dy, line, fontsize=7.2, color=lcol, va='center')
        dy -= 0.24

    # Action Buttons
    ax.add_patch(patches.FancyBboxPatch((8.8, 0.8), 2.2, 0.45, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#1e293b', edgecolor='#64748b', linewidth=1))
    ax.text(9.9, 1.02, "📋 Copy Candidate Fix", fontsize=7.8, color='#cbd5e1', ha='center', va='center')

    ax.add_patch(patches.FancyBboxPatch((11.2, 0.8), 1.6, 0.45, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#2563eb', edgecolor='#38bdf8', linewidth=1))
    ax.text(12.0, 1.02, "Apply Fix to Editor ✨", fontsize=7.8, fontweight='bold', color='#ffffff', ha='center', va='center')

    ax.set_xlim(0, 14.4)
    ax.set_ylim(0, 9.0)
    ax.axis('off')
    plt.tight_layout()
    plt.savefig('report_assets/ui_debugging_modal.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Created ui_debugging_modal.png")

# 5. Admin & AI Control Center UI
def create_ui_admin_ai_control():
    fig, ax = plt.subplots(figsize=(14.4, 9.0), dpi=300)
    ax.set_facecolor('#0b0f19')
    fig.patch.set_facecolor('#0b0f19')
    draw_browser_chrome(ax, "Admin Command Center & AI Sentinel — FIASCOde", "http://localhost:5173/admin")
    draw_navbar(ax, active_tab="Admin")

    # Header
    ax.text(1.0, 7.15, "Admin Command Center & AI Agent Sentinel", fontsize=14, fontweight='bold', color='#f8fafc', va='center')
    
    # Global AI Toggle
    ax.add_patch(patches.FancyBboxPatch((10.0, 6.95), 3.4, 0.42, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#064e3b', edgecolor='#10b981', linewidth=1))
    ax.text(11.7, 7.16, "🟢 Global AI Services: ACTIVE", fontsize=8, fontweight='bold', color='#34d399', ha='center', va='center')

    # Top KPI Metrics Cards
    kpis = [
        (1.0, 5.7, 2.8, 1.05, "Active Contests", "3 Ongoing (482 Contestants)", "#38bdf8"),
        (4.2, 5.7, 2.8, 1.05, "AI Debug Sessions", "1,248 Sessions (94.2% Fix Rate)", "#a855f7"),
        (7.4, 5.7, 2.8, 1.05, "Pending Recommendations", "2 Pending HITL Actions", "#f59e0b"),
        (10.6, 5.7, 2.8, 1.05, "Sandbox Health", "Docker: 100% (0.02s Avg Latency)", "#10b981")
    ]
    for x, y, w, h, ktitle, kval, kcol in kpis:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.04,rounding_size=0.1",
                                            facecolor='#111827', edgecolor=kcol, linewidth=1.2))
        ax.text(x + 0.15, y + h - 0.3, ktitle, fontsize=8, color='#94a3b8', va='center')
        ax.text(x + 0.15, y + 0.35, kval, fontsize=8.5, fontweight='bold', color='#f8fafc', va='center')

    # Pending HITL Recommendations Section
    ax.text(1.0, 5.3, "⚠️ AI Contest Master — Pending Administrative Recommendations (Human-in-the-Loop)", fontsize=10, fontweight='bold', color='#f59e0b', va='center')
    
    recs = [
        (1.0, 3.8, 12.4, 1.3, "Problem 3 (Hard) — Difficulty Spike Anomaly Detected",
         "Contest: Spring Code Sprint 2026 | Severity: High | Confidence: 94%\nObservation: 0 solves out of 142 submissions within 45 mins. 78% of failed submissions hit TLE on hidden Testcase 9.\nRecommendation: Increase CPU time limit from 1000ms to 2000ms or release clarifying input constraint hint.",
         "Approve & Apply (Extend Limit)", "Reject Action"),
        
        (1.0, 2.3, 12.4, 1.3, "Problem 5 (Medium) — Ambiguous Specification Flag",
         "Contest: Spring Code Sprint 2026 | Severity: Medium | Confidence: 88%\nObservation: 42 submissions failed on empty string input corner case due to ambiguous phrasing in section 2.\nRecommendation: Post clarifying broadcast announcement to all active contestants.",
         "Broadcast Clarification", "Dismiss")
    ]

    for x, y, w, h, rtitle, rbody, btn_app, btn_rej in recs:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.04,rounding_size=0.1",
                                            facecolor='#1e293b', edgecolor='#f59e0b', linewidth=1))
        ax.text(x + 0.2, y + h - 0.25, rtitle, fontsize=8.8, fontweight='bold', color='#f8fafc', va='center')
        ax.text(x + 0.2, y + 0.55, rbody, fontsize=7.2, color='#cbd5e1', va='center', linespacing=1.25)
        
        # Approve button
        ax.add_patch(patches.FancyBboxPatch((x + w - 3.8, y + 0.18), 2.2, 0.38, boxstyle="round,pad=0.02,rounding_size=0.08",
                                            facecolor='#16a34a', edgecolor='#22c55e', linewidth=1))
        ax.text(x + w - 2.7, y + 0.37, f"✓ {btn_app}", fontsize=7.2, fontweight='bold', color='#ffffff', ha='center', va='center')
        
        # Reject button
        ax.add_patch(patches.FancyBboxPatch((x + w - 1.4, y + 0.18), 1.2, 0.38, boxstyle="round,pad=0.02,rounding_size=0.08",
                                            facecolor='#991b1b', edgecolor='#ef4444', linewidth=1))
        ax.text(x + w - 0.8, y + 0.37, f"✕ {btn_rej}", fontsize=7.2, fontweight='bold', color='#ffffff', ha='center', va='center')

    # Audit Log Snippet
    ax.text(1.0, 1.9, "📜 Immutable Agent Audit Log (Cryptographic Timestamping)", fontsize=9.5, fontweight='bold', color='#f8fafc', va='center')
    ax.add_patch(patches.Rectangle((1.0, 0.5), 12.4, 1.2, facecolor='#090d16', edgecolor='#1e293b', linewidth=1))
    
    logs = [
        "[2026-10-08 20:12:04 UTC] ContestMaster: Scanned Contest #104. Computed health index: 92.4%. Log ID: #AUD-9821",
        "[2026-10-08 20:14:18 UTC] Admin (vignesh.dev): Approved time limit adjustment for Problem #3. Event dispatched.",
        "[2026-10-08 20:15:32 UTC] DebuggingAgent: Completed Session #SESS-412 for User #USR-89. Patch verified in 12ms."
    ]
    ly = 1.45
    for log in logs:
        ax.text(1.2, ly, log, fontsize=7.2, color='#94a3b8', va='center')
        ly -= 0.35

    ax.set_xlim(0, 14.4)
    ax.set_ylim(0, 9.0)
    ax.axis('off')
    plt.tight_layout()
    plt.savefig('report_assets/ui_admin_ai_control.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Created ui_admin_ai_control.png")

# 6. Leaderboard UI
def create_ui_leaderboard():
    fig, ax = plt.subplots(figsize=(14.4, 9.0), dpi=300)
    ax.set_facecolor('#0b0f19')
    fig.patch.set_facecolor('#0b0f19')
    draw_browser_chrome(ax, "Spring Code Sprint 2026 — Live Leaderboard", "http://localhost:5173/leaderboard")
    draw_navbar(ax, active_tab="Leaderboard")

    # Header & Timer
    ax.text(1.0, 7.15, "🏆 Spring Code Sprint 2026 — Live Standings", fontsize=14, fontweight='bold', color='#f8fafc', va='center')
    
    ax.add_patch(patches.FancyBboxPatch((10.8, 6.95), 2.6, 0.42, boxstyle="round,pad=0.02,rounding_size=0.08",
                                        facecolor='#1e293b', edgecolor='#f59e0b', linewidth=1))
    ax.text(12.1, 7.16, "⏳ Contest Time: 01:24:12 Remaining", fontsize=7.8, color='#fbbf24', ha='center', va='center')

    # Table Header
    ax.add_patch(patches.Rectangle((1.0, 6.3), 12.4, 0.45, facecolor='#1e293b', edgecolor='none'))
    ax.text(1.4, 6.52, "Rank", fontsize=8.5, fontweight='bold', color='#94a3b8', va='center')
    ax.text(2.6, 6.52, "Contestant", fontsize=8.5, fontweight='bold', color='#94a3b8', va='center')
    ax.text(6.0, 6.52, "Solved", fontsize=8.5, fontweight='bold', color='#94a3b8', va='center')
    ax.text(7.4, 6.52, "Total Score", fontsize=8.5, fontweight='bold', color='#94a3b8', va='center')
    ax.text(9.0, 6.52, "Penalty Time", fontsize=8.5, fontweight='bold', color='#94a3b8', va='center')
    ax.text(10.8, 6.52, "Problems Solved (P1 / P2 / P3 / P4)", fontsize=8.5, fontweight='bold', color='#94a3b8', va='center')

    # Table Rows
    ranks = [
        ("🥇 1", "#fbbf24", "vignesh.dev (You)", "4 / 4", "400 pts", "00:48:12", "AC (00:08) | AC (00:19) | AC (00:34) | AC (00:48)"),
        ("🥈 2", "#cbd5e1", "alex_coder99", "4 / 4", "400 pts", "00:59:45", "AC (00:12) | AC (00:22) | AC (00:41) | AC (00:59)"),
        ("🥉 3", "#cd7f32", "chen_algorithms", "3 / 4", "300 pts", "00:36:10", "AC (00:06) | AC (00:15) | AC (00:36) | WA (3 att)"),
        ("4", "#94a3b8", "priya_sharma", "3 / 4", "300 pts", "00:44:20", "AC (00:09) | AC (00:24) | AC (00:44) | --"),
        ("5", "#94a3b8", "dev_master_x", "2 / 4", "200 pts", "00:21:05", "AC (00:05) | AC (00:21) | WA (2 att) | --"),
        ("6", "#94a3b8", "code_ninja42", "2 / 4", "200 pts", "00:28:50", "AC (00:11) | AC (00:28) | -- | --"),
        ("7", "#94a3b8", "byte_wizard", "1 / 4", "100 pts", "00:07:30", "AC (00:07) | TLE (4 att) | -- | --")
    ]

    y = 5.65
    for rank, rcol, user, solved, score, penalty, pbreak in ranks:
        is_user = ("(You)" in user)
        ax.add_patch(patches.Rectangle((1.0, y), 12.4, 0.55,
                                       facecolor='#1e293b' if is_user else ('#111827' if int(y*10)%2==0 else '#0d131f'),
                                       edgecolor='#38bdf8' if is_user else '#1f2937', linewidth=1 if is_user else 0.5))
        ax.text(1.4, y + 0.27, rank, fontsize=8.5, fontweight='bold', color=rcol, va='center')
        ax.text(2.6, y + 0.27, user, fontsize=8.5, fontweight='bold' if is_user else 'normal',
                color='#38bdf8' if is_user else '#f8fafc', va='center')
        ax.text(6.0, y + 0.27, solved, fontsize=8, color='#34d399', va='center')
        ax.text(7.4, y + 0.27, score, fontsize=8, fontweight='bold', color='#f8fafc', va='center')
        ax.text(9.0, y + 0.27, penalty, fontsize=8, color='#94a3b8', va='center')
        ax.text(10.8, y + 0.27, pbreak, fontsize=7.2, color='#cbd5e1', va='center')
        y -= 0.62

    ax.set_xlim(0, 14.4)
    ax.set_ylim(0, 9.0)
    ax.axis('off')
    plt.tight_layout()
    plt.savefig('report_assets/ui_leaderboard.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Created ui_leaderboard.png")

create_ui_homepage()
create_ui_problem_catalog()
create_ui_code_editor()
create_ui_debugging_modal()
create_ui_admin_ai_control()
create_ui_leaderboard()
