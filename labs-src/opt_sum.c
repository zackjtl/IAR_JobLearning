#include <stdint.h>
/* Sum an array: watch loop structure, unrolling and register use change by -O level. */
int32_t sum_array(const int32_t *a, int n)
{
    int32_t s = 0;
    for (int i = 0; i < n; i++)
        s += a[i];
    return s;
}
