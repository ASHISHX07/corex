#pragma once

namespace CoreX
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

        static double normal_cdf(double x);
        static double normal_pdf(double x);
        
    };
}