#pragma once

namespace CoreX::math
{
	class Math
    {
    private:
        Math() = delete;
        Math(const Math&) = delete;
        Math& operator=(const Math&) = delete;
        ~Math() = default;
        
    public:
        static double getPcr(int putOi, int callOi);

        double normal_cdf(double x);
        double normal_pdf(double x);
        
    };
}