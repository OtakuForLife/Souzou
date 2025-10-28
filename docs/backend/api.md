

# Entities

| Method | Endpoint                               | Description                          |
| ------ | -------------------------------------- | ------------------------------------ |
| POST   | /api/entities/{id}/generate-embedding/ | Generate embedding for single entity |
| GET    | /api/entities/{id}/embedding-status/   | Check embedding status for entity    |

# Embeddings

| Method | Endpoint                             | Description                                   |
| ------ | ------------------------------------ | --------------------------------------------- |
| POST   | /api/embeddings/generate-batch/      | Batch generate (body: `{entity_ids: [...]}`)  |
| POST   | /api/embeddings/regenerate-all/      | Regenerate all embeddings                     |
| POST   | /api/embeddings/update-stale/        | Update stale embeddings (body: `{hours: 24}`) |

