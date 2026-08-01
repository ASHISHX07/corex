import math 
import sys

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
    return {"delta": delta, "gamma": gamma, "theta_per_day": theta_per_day, "vega_per_volpt": vega_per_volpt}
     

test = bs_greeks(100, 100, 1.0, 0.05, 0.20, 1)
print(test)
