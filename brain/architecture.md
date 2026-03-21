System Architecture

Foldaa operates as a layered runtime system.

Core layers:

Data Layer

Logic Layer

Execution Layer

Infrastructure Layer

Data Layer

Defines contracts or models which describe structured application data.

Logic Layer

Defines workflows which react to events and orchestrate actions.

Execution Layer

Nodes represent executable tools or functions used within workflows.

Infrastructure Layer

Deployment resources including workers, domains and routing.

Execution model:

Events trigger workflows.
Workflows execute nodes.
Nodes perform actions.
Actions may modify data or infrastructure.

This architecture enables software to be defined declaratively and executed dynamically.

The runtime must remain stateless where possible and delegate persistence to external data stores when necessary.
