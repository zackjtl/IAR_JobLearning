#include <stdint.h>
/* Dense switch: compiler may emit a jump table, a lookup table, or compare chains. */
int map_cmd(int c)
{
    switch (c) {
    case 0: return 11;
    case 1: return 29;
    case 2: return 37;
    case 3: return 41;
    case 4: return 53;
    case 5: return 67;
    default: return -1;
    }
}
