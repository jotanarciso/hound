// Exemplo de código JavaScript para testar a extensão
function calculateFibonacci(n) {
  if (n <= 1) {
    return n;
  }

  let a = 0,
    b = 1;
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }

  return b;
}

// Função para verificar se um número é primo
function isPrime(num) {
  if (num <= 1) return false;
  if (num <= 3) return true;

  if (num % 2 === 0 || num % 3 === 0) {
    return false;
  }

  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) {
      return false;
    }
  }

  return true;
}

// Exemplo de uso
console.log("Fibonacci de 10:", calculateFibonacci(10));
console.log("17 é primo?", isPrime(17));
