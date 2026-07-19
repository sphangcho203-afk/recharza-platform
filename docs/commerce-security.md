# Commerce security notes

- Prices are resolved from the server-side catalogue.
- Player verification currently validates format only.
- Development payment sessions cannot charge money.
- Orders are not persisted until database storage is connected.
- Real checkout must not launch without verified webhooks and fulfilment reconciliation.
