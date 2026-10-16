#include <stdint.h>
/* A hand-written clear loop: GCC may recognize the idiom and call memset. */
void clear_buf(uint8_t *p, unsigned n)
{
    for (unsigned i = 0; i < n; i++)
        p[i] = 0;
}
