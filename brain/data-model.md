Data Model Layer

Foldaa defines application data through structured contracts.

Contracts describe entities used by applications.

Each contract defines:

• fields
• types
• validation rules
• relationships

Contracts serve as the canonical representation of application state.

The runtime may automatically generate APIs and validation from these definitions.

Contracts are intended to remain simple and portable across different storage providers.

The data layer must remain decoupled from execution logic.
