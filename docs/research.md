Multi-tenancy is a software architecture where a single application instance serves multiple organizations, called tenants. Each tenant uses the same application but their data must be completely isolated from other tenants. Multi-tenancy is a core concept in Software as a Service (SaaS) platforms because it allows efficient use of resources while supporting many customers at the same time.

There are three common approaches to implementing multi-tenancy. Each approach has its own advantages and disadvantages in terms of cost, scalability, security, and maintenance.

### 1. Shared Database + Shared Schema (Using tenant_id)

In this approach, all tenants share the same database and the same set of tables. A special column called `tenant_id` is added to every table to identify which tenant each record belongs to. When a user makes a request, the application uses the `tenant_id` to ensure that only data belonging to that tenant is accessed.

**Advantages:**
- Low infrastructure cost because only one database is required
- Easy to deploy and manage
- Simple backups and monitoring
- Highly scalable for large numbers of tenants
- Well-suited for Docker and cloud-based environments

**Disadvantages:**
- Risk of data leakage if tenant filtering is implemented incorrectly
- Queries can become complex because every query must include tenant_id filtering
- Requires strong discipline in backend development to avoid security mistakes

---

### 2. Shared Database + Separate Schema (Per Tenant)

In this approach, all tenants share the same database server, but each tenant has its own database schema. Each schema contains its own set of tables. The application selects the correct schema based on the tenant making the request.

**Advantages:**
- Better data isolation compared to shared schema
- Reduced risk of cross-tenant data leakage
- Allows schema-level customization for tenants

**Disadvantages:**
- Schema management becomes complex as the number of tenants grows
- Database migrations must be run for every tenant schema
- Harder to automate in large-scale SaaS systems
- Slightly higher operational complexity compared to shared schema

---

### 3. Separate Database Per Tenant

In this approach, each tenant has its own completely separate database. The application connects to a different database depending on the tenant.

**Advantages:**
- Strongest data isolation
- Very high security
- Easy to meet strict compliance requirements

**Disadvantages:**
- Very high infrastructure and maintenance cost
- Poor scalability when many tenants are added
- Complex database management and backups
- Not suitable for small or medium SaaS products

---

### Comparison of Multi-Tenancy Approaches

| Approach | Pros | Cons |
|--------|------|------|
| Shared DB + Shared Schema | Low cost, scalable, easy deployment | Requires careful tenant filtering |
| Shared DB + Separate Schema | Better isolation | Complex schema management |
| Separate DB per Tenant | Maximum security | High cost, low scalability |

---

### Chosen Approach and Justification

For this project, the **Shared Database + Shared Schema with tenant_id** approach is selected.

This approach is best suited for a multi-tenant SaaS platform because it provides a good balance between scalability, cost, and maintainability. By enforcing strict tenant_id filtering at the API and database levels, complete data isolation can be achieved without the overhead of managing multiple schemas or databases.

In this system, every table (such as users, projects, and tasks) includes a tenant_id column. The backend extracts the tenant_id from the authenticated user’s JWT token and automatically applies it to all database queries. This ensures that users can only access data belonging to their own tenant. Super admin users are treated as an exception and are allowed to access data across tenants.

This approach is widely used in real-world SaaS applications because it allows the platform to scale to hundreds or thousands of tenants while keeping infrastructure costs low and deployments simple.
