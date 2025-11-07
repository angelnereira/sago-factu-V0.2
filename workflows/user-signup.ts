// Carga perezosa del paquete 'workflow' para evitar fallos si no está instalado
function getWorkflow() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const req = eval('require') as ((moduleId: string) => any) | undefined;
    if (typeof req === 'function') {
      return req('workflow');
    }
  } catch (_) {
    // ignore
  }

  return {
    // No-ops por defecto para desarrollo sin paquete
    sleep: async (_: string) => {},
    FatalError: class FatalError extends Error {},
  } as any;
}

export async function handleUserSignup(email: string) {
  "use workflow";
  const user = await createUser(email);
  await sendWelcomeEmail(user);
  const { sleep } = getWorkflow();
  await sleep("5s");
  await sendOnboardingEmail(user);
  return { userId: user.id, status: "onboarded" };
}

async function createUser(email: string) {
  "use step";
  console.log(`Creating user with email: ${email}`);
  return { id: crypto.randomUUID(), email };
}

async function sendWelcomeEmail(user: { id: string; email: string }) {
  "use step";
  console.log(`Sending welcome email to user: ${user.id}`);
  if (Math.random() < 0.3) {
    throw new Error("Retryable!");
  }
}

async function sendOnboardingEmail(user: { id: string; email: string }) {
  "use step";
  const { FatalError } = getWorkflow();
  if (!user.email.includes("@")) {
    throw new FatalError("Invalid Email");
  }
  console.log(`Sending onboarding email to user: ${user.id}`);
}
