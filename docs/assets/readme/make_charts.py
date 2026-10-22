"""Render the animated README charts from the model outputs in ml/out.

Run from the repo root: python3 docs/assets/readme/make_charts.py
Needs numpy, matplotlib and pillow.
"""

import csv
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib import font_manager
from matplotlib.animation import FuncAnimation, PillowWriter

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
ML = ROOT / "ml" / "out"

INK, PANEL, PAPER, MUTE = "#0a0a0a", "#141414", "#f3f3f0", "#8a8a85"
VIOLET, PEACH, LEMON, GREY = "#8f7bff", "#f0a070", "#f6d85a", "#4a4a47"
MODELS = ["rule", "logreg", "gbm", "mlp", "cnn"]
LABELS = {"rule": "Threshold rule", "logreg": "Logistic reg.", "gbm": "Gradient boosting",
          "mlp": "MLP", "cnn": "1D CNN"}

for f in font_manager.findSystemFonts():
    if "JetBrainsMono" in f or "GeistMono" in f:
        font_manager.fontManager.addfont(f)
plt.rcParams.update({
    "font.family": ["JetBrainsMono Nerd Font", "Geist Mono", "DejaVu Sans Mono"],
    "figure.facecolor": INK, "axes.facecolor": INK, "savefig.facecolor": INK,
    "text.color": PAPER, "axes.labelcolor": MUTE, "xtick.color": MUTE, "ytick.color": MUTE,
    "axes.edgecolor": GREY, "axes.spines.top": False, "axes.spines.right": False,
    "font.size": 10,
})


def ease(t):
    t = min(max(t, 0.0), 1.0)
    return 1 - (1 - t) ** 3


def save(anim, name, fps=20):
    anim.save(OUT / name, writer=PillowWriter(fps=fps), dpi=110)
    print("wrote", name)


def model_bars():
    res = json.load(open(ML / "results.json"))["models"]
    metrics = ["precision", "recall", "f1"]
    colors = [GREY, VIOLET, PEACH]
    fig, ax = plt.subplots(figsize=(8, 4.2))
    frames = 50

    def draw(i):
        ax.clear()
        k = ease(i / 35)
        x = np.arange(len(MODELS))
        for j, (m, c) in enumerate(zip(metrics, colors)):
            vals = np.array([res[n]["umafall"][m]["value"] for n in MODELS])
            ax.bar(x + (j - 1) * 0.26, vals * k, 0.24, color=c, label=m.upper() if m == "f1" else m.capitalize())
            if i > 38:
                lo = np.array([res[n]["umafall"][m]["lo"] for n in MODELS])
                hi = np.array([res[n]["umafall"][m]["hi"] for n in MODELS])
                ax.errorbar(x + (j - 1) * 0.26, vals, yerr=[vals - lo, hi - vals], fmt="none", ecolor=PAPER, lw=0.8, capsize=2)
        ax.set_xticks(x, [LABELS[n] for n in MODELS])
        ax.set_ylim(0, 1.08)
        ax.set_yticks([0, 0.25, 0.5, 0.75, 1])
        ax.grid(axis="y", color="#222", lw=0.6)
        ax.set_axisbelow(True)
        ax.legend(loc="upper left", frameon=False, ncol=3, fontsize=9)
        ax.set_title("UMAFall, 5-fold leave-subjects-out, 95% bootstrap CIs", loc="left", color=MUTE, fontsize=9)
        ax.get_xticklabels()[2].set_color(LEMON)

    fig.tight_layout()
    save(FuncAnimation(fig, draw, frames=frames), "model-comparison.gif")
    plt.close(fig)


def roc_curves():
    rows = list(csv.DictReader(open(ML / "oof.csv")))
    y = np.array([int(r["label"]) for r in rows])
    curves = {}
    for n in MODELS:
        p = np.array([float(r[f"p_{n}"]) for r in rows])
        order = np.argsort(-p, kind="stable")
        tp = np.concatenate([[0], np.cumsum(y[order])]) / y.sum()
        fp = np.concatenate([[0], np.cumsum(1 - y[order])]) / (1 - y).sum()
        curves[n] = (fp, tp, np.trapezoid(tp, fp) if hasattr(np, "trapezoid") else np.trapz(tp, fp))
    fig, ax = plt.subplots(figsize=(5.6, 4.6))
    colors = {"rule": GREY, "logreg": MUTE, "gbm": LEMON, "mlp": VIOLET, "cnn": PEACH}
    frames = 55

    def draw(i):
        ax.clear()
        k = ease(i / 40)
        ax.plot([0, 1], [0, 1], ls=":", color=GREY, lw=0.8)
        for n in MODELS:
            fp, tp, auc = curves[n]
            m = max(2, int(len(fp) * k))
            ax.plot(fp[:m], tp[:m], color=colors[n], lw=2.4 if n == "gbm" else 1.3,
                    label=f"{LABELS[n]}  {auc:.3f}")
        ax.set_xlim(-0.01, 0.5)
        ax.set_ylim(0.4, 1.01)
        ax.set_xlabel("False positive rate")
        ax.set_ylabel("True positive rate")
        ax.legend(loc="lower right", frameon=False, fontsize=8, title="AUROC", title_fontsize=8)
        ax.grid(color="#222", lw=0.6)
        ax.set_title("ROC, out-of-fold, zoomed", loc="left", color=MUTE, fontsize=9)

    fig.subplots_adjust(left=0.14, right=0.97, top=0.92, bottom=0.12)
    save(FuncAnimation(fig, draw, frames=frames), "roc.gif")
    plt.close(fig)


def market_scale():
    # Every figure is cited in the README market table.
    data = [
        ("HK delivery platform workers", 12_900, GREY),
        ("HK compensation cases a year", 41_254, GREY),
        ("HK registered construction workers", 667_603, MUTE),
        ("Mainland riders in injury scheme (Jul 2025)", 12_300_000, VIOLET),
        ("Mainland new-forms-of-employment workers", 84_000_000, PEACH),
        ("Motorcyclists in Asia", 400_000_000, LEMON),
    ]
    fig, ax = plt.subplots(figsize=(8, 3.8))
    frames = 60

    def fmt(v):
        return f"{v / 1e6:,.1f}M" if v >= 1e6 else f"{v:,.0f}"

    def draw(i):
        ax.clear()
        for j, (name, v, c) in enumerate(data):
            k = ease((i - j * 5) / 25)
            w = 10 ** (np.log10(1_000) + (np.log10(v) - np.log10(1_000)) * k)
            ax.barh(j, w, color=c, height=0.62, left=0)
            if k > 0.95:
                ax.text(w * 1.25, j, fmt(v), va="center", color=PAPER, fontsize=9)
        ax.set_xscale("log")
        ax.set_xlim(1_000, 4e9)
        ax.set_yticks(range(len(data)), [d[0] for d in data], fontsize=8.5)
        ax.invert_yaxis()
        ax.xaxis.set_visible(False)
        ax.spines["bottom"].set_visible(False)
        ax.set_title("Log scale. Hong Kong is the sandbox, the region is the market", loc="left", color=MUTE, fontsize=9)

    fig.subplots_adjust(left=0.4, right=0.98, top=0.9, bottom=0.04)
    save(FuncAnimation(fig, draw, frames=frames), "market-scale.gif")
    plt.close(fig)


def crash_trace():
    win = np.array(json.load(open(ML / "demo_windows.json"))["crash"]["samples"])  # rows: t (s), ax, ay, az (g)
    t = win[:, 0]
    g = np.linalg.norm(win[:, 1:4], axis=1)
    peak = int(np.argmax(g))
    fig, ax = plt.subplots(figsize=(8, 3.2))
    frames = 70

    def draw(i):
        ax.clear()
        m = max(2, int(len(t) * min(i / 50, 1)))
        ax.fill_between(t[:m], 0, g[:m], color=VIOLET, alpha=0.18)
        ax.plot(t[:m], g[:m], color=VIOLET, lw=1.4)
        ax.axhline(1, color=GREY, lw=0.6, ls=":")
        if m > peak:
            ax.scatter([t[peak]], [g[peak]], s=60, color=LEMON, zorder=3)
            ax.annotate(f"impact {g[peak]:.1f} g", (t[peak], g[peak]), xytext=(12, -4),
                        textcoords="offset points", color=LEMON, fontsize=9)
        if i > 52:
            ax.text(0.99, 0.9, "crash p > 0.5  |  30 s to cancel  |  dispatch", transform=ax.transAxes,
                    ha="right", color=PEACH, fontsize=9)
        ax.set_xlim(t[0], t[-1])
        ax.set_ylim(0, max(g) * 1.18)
        ax.set_xlabel("seconds")
        ax.set_ylabel("|a|  (g)")
        ax.set_title("A 6 s window from the synthetic crash set, as the detector sees it", loc="left", color=MUTE, fontsize=9)

    fig.tight_layout()
    save(FuncAnimation(fig, draw, frames=frames), "crash-trace.gif")
    plt.close(fig)


if __name__ == "__main__":
    model_bars()
    roc_curves()
    market_scale()
    crash_trace()
