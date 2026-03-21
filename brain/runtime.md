Runtime Model

Foldaa executes software through a deterministic runtime loop.

Event
→ Workflow
→ Node
→ Action

Events originate from:

API calls
User actions
External integrations
System triggers

When an event occurs the runtime resolves matching workflows.

Workflows consist of ordered or conditional node executions.

Nodes execute tools which perform actions such as:

database operations
API calls
infrastructure changes
external service interactions

Execution results can trigger additional workflows creating reactive systems.

The runtime must support:

event routing
execution scheduling
retry logic
failure isolation
