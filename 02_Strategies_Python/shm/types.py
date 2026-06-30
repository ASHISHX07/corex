from dataclasses import dataclass


@dataclass
class IndexData:
    symbol:         str
    ltp:            float
    exchFeedTime:   int
    high:           float
    low:            float
    open:           float
    prevClose:      float
    ch:             float
    chp:            float
    fp:             float
    fpch:           float
    fpchp:          float
    tCallOi:        int
    tPutOi:         int
    iVixLtp:        float
    iVixCh:         float
    iVixChp:        float
    signal:         int
    action:         int

@dataclass
class OptionData:
    symbol:         str
    cp:             int     # 1 = CE. 2 = PE
    strike:         int
    ltp:            float
    ch:             float
    chp:            float
    volume:         int
    oi:             int
    chngInOi:       int
    prevOi:         int
    totBuyQty:      int
    totSellQty:     int
    avgTradePrice:  float
    high:           float
    low:            float
    open:           float
    prevClose:      float
    upperCkt:       float
    lowerCkt:       float
    iv:             float
    delta:          float
    theta:          float
    gamma:          float
    vega:           float
    lastTradedQty:  int
    exchFeedTime:   int
    lastTradedAt:   int
    signal:         int
    action:         int
