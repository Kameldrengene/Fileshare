#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <sys/time.h>
#include <omp.h>

#define SIZE 10000000

volatile float a[SIZE];
volatile float b[SIZE];

int main(int argc, char **argv)
{
  long int       i;
  double         sum;
  struct timeval time1, time2;
  int thread_count;
  gettimeofday(&time1, 0);

  srand(time(0));


  
  for (i = 0; i < SIZE; i++)
  {
    a[i] = rand();
    b[i] = rand();
  }
      
  sum = 0.0;
  
  for (i = 0; i < SIZE; i++)
  {
    sum = sum + a[i]*b[i];
  }

  gettimeofday(&time2, 0);
  
  printf("Elapsed time (us) = %d\n", (time2.tv_sec-time1.tv_sec)*1000000 + time2.tv_usec - time1.tv_usec);

  return 0;
}                
