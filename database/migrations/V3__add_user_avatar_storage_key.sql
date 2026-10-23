-- Store the provider asset identifier separately from its delivery URL.
ALTER TABLE users
    ADD COLUMN avatar_storage_key VARCHAR(255) NULL;
