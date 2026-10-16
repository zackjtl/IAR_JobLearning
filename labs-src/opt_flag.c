#include <stdint.h>
/* Set by an interrupt handler. Missing volatile => optimizer may hoist the load out of the loop. */
uint32_t g_ready;
volatile uint32_t g_ready_v;

void wait_ready(void)
{
    while (g_ready == 0) { }
}

void wait_ready_volatile(void)
{
    while (g_ready_v == 0) { }
}
