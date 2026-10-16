#include <stdint.h>
/* Small helper + constant arguments: inlining and constant folding. */
static int32_t scale(int32_t x, int32_t k) { return (x * k) >> 4; }

int32_t calc(void)
{
    return scale(100, 8) + scale(20, 16);
}

int32_t calc_var(int32_t x)
{
    return scale(x, 8) + scale(x, 16);
}
