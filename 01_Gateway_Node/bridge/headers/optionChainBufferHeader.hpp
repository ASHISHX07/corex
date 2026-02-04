struct ControllerBuffer {
    int systemStatus;
    int socketSymbolCount;
    int tbtSocketSymbolCount;
    int apiSymbolCount;
    int marketDepthCount;
    int signal;
    int action;
};

struct IndicsBuffer {
    double instrument;
    double ltp;
    double exchFeedTime;
    double high;
    double low;
    double open;
    double prevClosePrice;
    double ch;
    double chp;
};

struct OptionChainBuffer {
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
