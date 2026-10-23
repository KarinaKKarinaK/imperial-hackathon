"""Metrics insurance and revenue model, low / central / high.

Run: python3 docs/research/insurance_model.py
Every input is SOURCED (see INSURANCE_MODEL.md for the quote and link) or an
ASSUMPTION with a range. Change an input here and rerun; nothing else is hand-typed.
"""

CASES = ("low", "central", "high")

# ---------- sourced inputs ----------
RIDERS_HK = 12_900  # C&SD THS No. 81, LegCo CB(1)410/2025(04)
MEAN_MONTHLY_INCOME = 10_900  # LD rider survey, same paper, Annex 2
FULL_TIME_MONTHLY_INCOME = 21_600  # same survey, riders working over 40 hours a week
HOURS_PER_WEEK = 23.7  # same survey
SICK_LEAVE_SHARE = 0.8  # ECO: four fifths of the earnings difference (LD Concise Guide, Apr 2026)
DEATH_MIN = 514_510  # ECO minimum for death, applies to platform workers (LWB Jul 2026)
FATAL_SHARE = 38 / 3036  # LD OSH Statistics 2024, transportation, storage, postal and courier
MAINLAND_RATE_PER_ORDER_YUAN = 0.07  # instant delivery, 人社部发〔2025〕24号 as applied in Fujian

# ---------- assumptions, low / central / high ----------
A = {
    "tier_one_months_of_income": (0.5, 0.5, 0.5),  # tier one = half a month of platform income
    "tier_one_income_base": (5_000, MEAN_MONTHLY_INCOME, FULL_TIME_MONTHLY_INCOME),
    "injuries_per_1000_riders_year": (10, 20, 40),  # 9.8 all industries (LD 2024); road exposure doubles it or more
    "sick_leave_days": (14, 30, 60),
    "medical_hkd": (2_000, 5_000, 10_000),
    "death_payout_hkd": (DEATH_MIN, DEATH_MIN, 84 * FULL_TIME_MONTHLY_INCOME),  # ECO formula high case
    "ppi_share_of_injuries": (0.02, 0.05, 0.10),
    "ppi_payout_hkd": (50_000, 100_000, 200_000),
    "target_loss_ratio": (0.70, 0.60, 0.50),
    "metrics_fee_share_of_premium": (0.03, 0.05, 0.10),
    "mainland_orders_per_year_one_platform": (10e9, 20e9, 30e9),
    "mainland_fee_share": (0.005, 0.01, 0.03),
}


def case(i: int) -> dict:
    a = {k: v[i] for k, v in A.items()}
    daily = a["tier_one_income_base"] / 30
    tier_one = round(a["tier_one_months_of_income"] * a["tier_one_income_base"], -1)
    severity = (
        tier_one
        + SICK_LEAVE_SHARE * daily * a["sick_leave_days"]
        + a["medical_hkd"]
        + FATAL_SHARE * a["death_payout_hkd"]
        + a["ppi_share_of_injuries"] * a["ppi_payout_hkd"]
    )
    freq = a["injuries_per_1000_riders_year"] / 1000
    pure_year = freq * severity
    hours_year = HOURS_PER_WEEK * 52
    loaded_year = pure_year / a["target_loss_ratio"]
    fee_year = loaded_year * a["metrics_fee_share_of_premium"]
    mainland_pool_yuan = a["mainland_orders_per_year_one_platform"] * MAINLAND_RATE_PER_ORDER_YUAN
    return {
        "tier_one_payout_hkd": tier_one,
        "cost_per_injury_hkd": severity,
        "pure_premium_rider_year_hkd": pure_year,
        "loaded_premium_rider_year_hkd": loaded_year,
        "loaded_premium_rider_month_hkd": loaded_year / 12,
        "loaded_premium_per_20min_window_hkd": loaded_year / hours_year / 3,
        "metrics_fee_rider_year_hkd": fee_year,
        "hk_pilot_revenue_year_hkd": fee_year * RIDERS_HK,
        "mainland_premium_pool_yuan": mainland_pool_yuan,
        "mainland_metrics_revenue_yuan": mainland_pool_yuan * a["mainland_fee_share"],
    }


def main() -> None:
    rows = [case(i) for i in range(3)]
    print("| Output | " + " | ".join(CASES) + " |")
    print("|---|---|---|---|")
    for k in rows[0]:
        vals = [r[k] for r in rows]
        fmt = (lambda v: f"{v:,.2f}") if max(vals) < 10 else (lambda v: f"{v:,.0f}")
        print(f"| {k} | " + " | ".join(fmt(v) for v in vals) + " |")


if __name__ == "__main__":
    main()
