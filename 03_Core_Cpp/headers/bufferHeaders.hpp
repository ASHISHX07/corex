#ifndef BUFFER_HEADER_H
#define BUFFER_HEADER_H

struct ControllerBufferHeader {
    double systemStatus;
    double socketSymbolCount;
    double tbtSocketSymbolCount;
    double apiSymbolCount;
    double marketDepthCount;
    double signal;
    double action;
};

struct OptionChainBufferHeader {
    double instrument;
    double ltp;
    double volume;
    double oi;
    double chngInOi;
    double totBuyQty;
    double totSellQty;
    double avgTradePrice;
    double high;
    double low;
    double open;
    double prevClose;
    double upperCkt;
    double lowerCkt;
    double exchFeedTime;
    double ch;
    double chp;
    double signal;
    double action;
};

constexpr int DATA_STRIDE { sizeof(OptionChainBufferHeader) / sizeof(double) };

#endif // BUFFER_HEADER_H