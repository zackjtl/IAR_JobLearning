#include <stdint.h>
/* Small functions compiled for Cortex-M0 (Thumb-1) for the step-by-step walkthrough. */
int sum_n(int n)
{
    int s = 0;
    for (int i = 1; i <= n; i++)
        s += i;
    return s;
}

int max3(int a, int b, int c)
{
    int m = a;
    if (b > m) m = b;
    if (c > m) m = c;
    return m;
}

int count_bits(uint32_t x)
{
    int c = 0;
    while (x) {
        c += x & 1u;
        x >>= 1;
    }
    return c;
}
