import math 
import sys

TOL_PRICE, TOL_GREEK, TOL_IV, VEGA_FLOOR = 1e-4, 1e-4, 1e-5, 1e-8
PRICE_TOL, MAX_ITR, MAX_ITR_BISECT = 1e-7, 50, 100
SIGMA_TOL = 1e-4


def normal_cdf(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))

def normal_pdf(x):
    return (1/math.sqrt(2*math.pi)) * math.exp(-x**2/2)

def bs_price(S, K, T, r, sigma, cp, q=0.0):
    if T <= 0:
        if cp == 1:
            return max(S-K, 0)
        elif cp == 2:
            return max(K-S, 0)
        else:
            raise ValueError(f"invalid cp value: {cp}, expected 1 (call) or 2 (put)")

    d1 = (math.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma* math.sqrt(T))
    d2 = d1 - (sigma* math.sqrt(T))

    if cp == 1:
        call = S*math.exp(-q*T) * normal_cdf(d1) - K*math.exp(-r*T)* normal_cdf(d2)
        return call
    elif cp == 2:
        put = K*math.exp(-r*T)* normal_cdf(-d2) - S*math.exp(-q*T) * normal_cdf(-d1)
        return put
    else:
        raise ValueError(f"invalid cp value: {cp}, expected 1 (call) or 2 (put)")
    
def bs_greeks(S, K, T, r, sigma, cp, q=0.0):
    d1 = (math.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma* math.sqrt(T))
    d2 = d1 - (sigma* math.sqrt(T))

    gamma = (math.exp(-q*T) * normal_pdf(d1)) / (S*sigma*math.sqrt(T))

    vega_raw = S*math.exp(-q*T)*normal_pdf(d1)*math.sqrt(T)
    vega_per_volpt = vega_raw * 0.01
    
    if cp == 1:
        delta = math.exp(-q*T) * normal_cdf(d1)
        theta_year = -S*math.exp(-q*T) * normal_pdf(d1)*(sigma/(2*math.sqrt(T))) - r*K*math.exp(-r*T)*normal_cdf(d2) + q*S*math.exp(-q*T)*normal_cdf(d1)
    elif cp == 2:
        delta = -math.exp(-q*T) * normal_cdf(-d1)
        theta_year = -S*math.exp(-q*T) * normal_pdf(d1)*(sigma/(2*math.sqrt(T))) + r*K*math.exp(-r*T)*normal_cdf(-d2) - q*S*math.exp(-q*T)*normal_cdf(-d1)
    else:
        raise ValueError(f"invalid cp value: {cp}, expected 1 (call) or 2 (put)")
        
    theta_per_day = theta_year/365
    return {"delta": delta, "gamma": gamma, "theta_per_day": theta_per_day, "vega_raw" : vega_raw, "vega_per_volpt": vega_per_volpt}
     

def bs_implied_vol (price, S, K, T, r, cp, q=0.0):
    if T <= 0:
        if cp == 1:
            return max(S-K, 0)
        elif cp == 2:
            return max(K-S, 0)
        else:
            raise ValueError(f"invalid cp value: {cp}, expected 1 (call) or 2 (put)")
        
    if cp == 1:
        intrinsic = max(S-K*math.exp(-r*T), 0)
    elif cp == 2:
        intrinsic = max(K*math.exp(-r*T)-S, 0)
    else:
        raise ValueError(f"Invalid cp value")

    if price < intrinsic - 1e-6 :
        return float ('nan')

    sigma = 0.2  #rn it's just a guess, for testing
    for i in range(MAX_ITR):
        price_guess = bs_price(S, K, T, r, sigma, cp, q=0.0)
        greeks = bs_greeks(S, K, T, r, sigma, cp, q=0.0)
        vega = greeks["vega_raw"]

        error = price_guess - price

        if abs(error) < PRICE_TOL:
            return sigma 
        if abs(vega) < VEGA_FLOOR:
            break

        sigma = max(sigma - (error / vega), 1e-6)


    # near expiry + deep ITM/OTM, vega -> 0 and price is flat across, so i mean bisection will work and get you some converge value, but don't trust it as a real IV estimate 

    low, high = 0.005, 5
    for i in range(MAX_ITR_BISECT):
        mid = (low + high) / 2
        price_mid = bs_price(S, K, T, r, mid, cp, q=0.0)

        if abs(price_mid - price) < PRICE_TOL:
            return mid
        if (high-low) < SIGMA_TOL:
            return mid
        if price_mid < price:
            low = mid
        if price_mid > price:
            high = mid
    return mid



