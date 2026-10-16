#include <stdint.h>
/* Where does each object end up? (inspected with arm-none-eabi-nm -S and size -A) */
int32_t        g_init       = 42;          /* initialized global      */
int32_t        g_zero;                     /* zero-initialized global */
int32_t        g_zero_expl  = 0;           /* explicitly zero         */
const int32_t  g_const      = 7;           /* const global            */
const uint8_t  g_table[256] = { 1, 2, 3 }; /* large const table       */
static int32_t s_file_static = 5;          /* file-scope static       */
const char    *g_msg        = "hello";     /* pointer (RW) to literal */
char           g_buf[64];                  /* uninitialized array     */
__attribute__((section(".noinit"))) uint32_t g_reset_reason;

int32_t counter(void)
{
    static int32_t calls;                  /* static local (zero)     */
    static int32_t base = 100;             /* static local (init)     */
    int32_t local = base + calls++;        /* automatic: stack/reg    */
    return local + s_file_static + g_table[3] + g_const;
}

void unused_function(void) { g_buf[0] = 1; }

int main(void)
{
    g_zero = counter() + g_init + g_zero_expl + g_msg[0] + (int32_t)g_reset_reason;
    for (;;) { }
}

void Reset_Handler(void) { main(); }
