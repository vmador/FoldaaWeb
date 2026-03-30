# Infrastructure Automation & Provisioning

In the Campfire ecosystem, **Infrastructure as a Service (IaaS)** is automated from the moment a **Temp** is ignited into a **Tent**.

## 1. Automatic Provisioning
When a client (Igniter) rents a Temp, the System:
- **Repositories**: Creates a new GitHub repository based on the Temp's boilerplate.
- **Environments**: Sets up standard environments for `staging` and `production`.
- **BaaS**: Provisions a Supabase project with ready-to-use Auth, DB, and Realtime configurations.

## 2. CI/CD Pipeline Ready
Every Tent is connected to an active pipeline from Day 1.
- **Vercel**: Automated frontend deployments.
- **Supabase**: Automated migrations and edge function deployments.
- **Monitoring**: Integration with Sentry and PostHog for immediate observability.

## 3. Configurable Stacks
Clients select Temps with pre-built stacks, but the System remains configurable:
- **Next.js**: Preferred frontend framework.
- **Supabase**: Standardized backend and database.
- **AI Agents**: Pre-configured LangChain/OpenAI integrations.
- **Payments**: Ready-to-use checkout modules (e.g., LemonSqueezy).

## 4. Scalability & Maintenance
The pre-configured infrastructure allows for:
- **Horizontal Scaling**: Handled by Vercel and Supabase.
- **Monitoring**: Basic health checks and usage metrics are active immediately.
- **Maintenance**: Automated dependency updates and standard security patches.

## 5. Transition & Standalone Product
If a client decides to move away from the "subscription" model, the Tent can be detached.
- **Ownership Transfer**: Repositories and BaaS accounts can be transferred to the client.
- **Detached Product**: The project becomes a standalone application with its original infrastructure intact.
