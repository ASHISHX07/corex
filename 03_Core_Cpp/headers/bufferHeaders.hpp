#ifndef BUFFER_HEADER_H
#define BUFFER_HEADER_H

struct ControllerBufferHeader {
    int systemStatus;
    int sIndicesCount;
    int sOptionsCount;
    int tbtSocketSymbolCount;
    int apiSymbolCount;
    int marketDepthCount;
    int signal;
    int action;
};

struct IndicsBufferHeader {
    double instrument;
    double ltp;
    double exchFeedTime;
    double high;
    double low;
    double open;
    double prevClose;
    double ch;
    double chp;
    double signal;
    double action;
};

struct OptionsBufferHeader {
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

#endif // BUFFER_HEADER_H