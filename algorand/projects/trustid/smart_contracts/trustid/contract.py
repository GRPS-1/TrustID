from algopy import ARC4Contract, arc4, Txn, Global, Bytes, op, UInt64


class TrustID(ARC4Contract):

    def box_key(self, cred_id: arc4.String) -> Bytes:
        return Bytes(b"cred_") + cred_id.bytes

    def access_grant_key(self, cred_id: arc4.String, grantee: Bytes) -> Bytes:
        """Key for access grants: g_{hash(cred_id)}_{grantee_address}"""
        # Hash the credential ID to keep box name under 64 bytes
        # g_ (2) + hash(16) + _ (1) + address(32) = 51 bytes
        cred_hash = op.sha256(cred_id.bytes)
        # Take first 16 bytes of hash
        cred_hash_short = op.substring(cred_hash, 0, 16)
        return Bytes(b"g_") + cred_hash_short + Bytes(b"_") + grantee

    def parse_owner(self, value: Bytes, hash_length: UInt64) -> Bytes:
        """Extract owner address from stored data"""
        # Owner is stored after: hash (2 + len) + "|" (1)
        owner_start = hash_length + 2 + 1
        return op.substring(value, owner_start, owner_start + 32)

    def parse_access(self, value: Bytes) -> Bytes:
        """Extract access level from stored data"""
        # Access is at the end after last "|"
        # Find last occurrence by scanning from end
        length = value.length
        i = length - 1
        
        # Find the last "|" separator
        while i > 0:
            if op.substring(value, i, i + 1) == Bytes(b"|"):
                # Found last separator, access is after it
                # Read ARC4 string: 2 bytes length + data
                access_start = i + 1
                access_len_bytes = op.substring(value, access_start, access_start + 2)
                access_len = op.btoi(access_len_bytes)
                return op.substring(value, access_start, access_start + 2 + access_len)
            i = i - 1
        
        # Default to public if not found
        return Bytes(b"\x00\x06public")  # ARC4 encoded "public"

    def is_revoked(self, value: Bytes) -> bool:
        """Check if credential is revoked"""
        # Check if "|revoked" appears in the data
        return op.substring(value, value.length - 8, value.length) == Bytes(b"|revoked")


    # -----------------------------
    # Add Credential
    # -----------------------------
    @arc4.abimethod()
    def add_credential(
        self,
        cred_id: arc4.String,
        hash_value: arc4.String,
        cid: arc4.String,
        cred_type: arc4.String,
        access: arc4.String,
    ) -> None:

        # Validate access level
        assert access.native == "public" or access.native == "private", "Invalid access level"

        key = self.box_key(cred_id)

        data = (
            hash_value.bytes
            + Bytes(b"|")
            + Txn.sender.bytes
            + Bytes(b"|")
            + cid.bytes
            + Bytes(b"|")
            + cred_type.bytes
            + Bytes(b"|")
            + op.itob(Global.latest_timestamp)
            + Bytes(b"|active|")
            + access.bytes
        )

        value, exists = op.Box.get(key)

        # prevent overwrite by others
        if exists:
            owner = self.parse_owner(value, hash_value.bytes.length)
            assert owner == Txn.sender.bytes, "Not credential owner"

            op.Box.put(key, data)

        else:
            op.Box.create(key, data.length)
            op.Box.put(key, data)


    # -----------------------------
    # Get Credential (with access control)
    # -----------------------------
    @arc4.abimethod(readonly=True)
    def get_credential(
        self,
        cred_id: arc4.String,
    ) -> arc4.String:

        key = self.box_key(cred_id)

        value, exists = op.Box.get(key)
        assert exists, "Credential not found"

        # Parse access level and owner
        access_bytes = self.parse_access(value)
        
        # Decode ARC4 string to check access level
        # ARC4 string format: 2 bytes length + data
        access_len = op.btoi(op.substring(access_bytes, 0, 2))
        access_str = op.substring(access_bytes, 2, 2 + access_len)
        
        # If private, check owner or access grant
        if access_str == Bytes(b"private"):
            # Extract hash length to find owner
            hash_len = op.btoi(op.substring(value, 0, 2))
            owner = self.parse_owner(value, hash_len)
            
            # Check if sender is owner
            is_owner = Txn.sender.bytes == owner
            
            # Check if sender has been granted access
            grant_key = self.access_grant_key(cred_id, Txn.sender.bytes)
            grant_value, has_grant = op.Box.get(grant_key)
            
            # Check if grant is still valid (not expired)
            is_grant_valid = False
            if has_grant:
                # Grant format: expiry_timestamp (8 bytes)
                expiry = op.btoi(grant_value)
                is_grant_valid = expiry > Global.latest_timestamp or expiry == 0  # 0 = no expiry
            
            assert is_owner or is_grant_valid, "Access denied: private credential"

        return arc4.String.from_bytes(value)


    # -----------------------------
    # Grant Access to Private Credential
    # -----------------------------
    @arc4.abimethod()
    def grant_access(
        self,
        cred_id: arc4.String,
        grantee: arc4.Address,
        expiry_timestamp: arc4.UInt64,  # 0 for no expiry, or Unix timestamp
    ) -> None:
        """Grant temporary access to a private credential"""
        
        key = self.box_key(cred_id)
        value, exists = op.Box.get(key)
        assert exists, "Credential not found"
        
        # Only owner can grant access
        hash_len = op.btoi(op.substring(value, 0, 2))
        owner = self.parse_owner(value, hash_len)
        assert owner == Txn.sender.bytes, "Not credential owner"
        
        # Check it's a private credential
        access_bytes = self.parse_access(value)
        access_len = op.btoi(op.substring(access_bytes, 0, 2))
        access_str = op.substring(access_bytes, 2, 2 + access_len)
        assert access_str == Bytes(b"private"), "Only private credentials can have grants"
        
        # Create grant
        grant_key = self.access_grant_key(cred_id, grantee.bytes)
        grant_data = op.itob(expiry_timestamp.native)
        
        grant_exists = op.Box.get(grant_key)[1]
        if grant_exists:
            op.Box.put(grant_key, grant_data)
        else:
            op.Box.create(grant_key, grant_data.length)
            op.Box.put(grant_key, grant_data)


    # -----------------------------
    # Revoke Access Grant
    # -----------------------------
    @arc4.abimethod()
    def revoke_access(
        self,
        cred_id: arc4.String,
        grantee: arc4.Address,
    ) -> None:
        """Revoke access grant for a specific user"""
        
        key = self.box_key(cred_id)
        value, exists = op.Box.get(key)
        assert exists, "Credential not found"
        
        # Only owner can revoke access
        hash_len = op.btoi(op.substring(value, 0, 2))
        owner = self.parse_owner(value, hash_len)
        assert owner == Txn.sender.bytes, "Not credential owner"
        
        # Delete grant
        grant_key = self.access_grant_key(cred_id, grantee.bytes)
        grant_exists = op.Box.get(grant_key)[1]
        assert grant_exists, "No grant found for this user"
        
        op.Box.delete(grant_key)


    # -----------------------------
    # Check Access Grant
    # -----------------------------
    @arc4.abimethod(readonly=True)
    def check_access(
        self,
        cred_id: arc4.String,
        user: arc4.Address,
    ) -> arc4.Bool:
        """Check if a user has access to a credential"""
        
        key = self.box_key(cred_id)
        value, exists = op.Box.get(key)
        
        if not exists:
            return arc4.Bool(False)
        
        # Parse access level
        access_bytes = self.parse_access(value)
        access_len = op.btoi(op.substring(access_bytes, 0, 2))
        access_str = op.substring(access_bytes, 2, 2 + access_len)
        
        # Public credentials are accessible to everyone
        if access_str == Bytes(b"public"):
            return arc4.Bool(True)
        
        # Check if user is owner
        hash_len = op.btoi(op.substring(value, 0, 2))
        owner = self.parse_owner(value, hash_len)
        
        if user.bytes == owner:
            return arc4.Bool(True)
        
        # Check for access grant
        grant_key = self.access_grant_key(cred_id, user.bytes)
        grant_value, has_grant = op.Box.get(grant_key)
        
        if has_grant:
            expiry = op.btoi(grant_value)
            if expiry == 0 or expiry > Global.latest_timestamp:
                return arc4.Bool(True)
        
        return arc4.Bool(False)


    # -----------------------------
    # Verify Credential (checks revocation)
    # -----------------------------
    @arc4.abimethod(readonly=True)
    def verify_credential(
        self,
        cred_id: arc4.String,
        hash_value: arc4.String,
    ) -> arc4.Bool:

        key = self.box_key(cred_id)

        value, exists = op.Box.get(key)
        assert exists, "Credential not found"

        # Check if revoked
        if self.is_revoked(value):
            return arc4.Bool(False)

        prefix = op.substring(value, 0, hash_value.bytes.length)

        return arc4.Bool(prefix == hash_value.bytes)


    # -----------------------------
    # Revoke
    # -----------------------------
    @arc4.abimethod()
    def revoke_credential(
        self,
        cred_id: arc4.String,
    ) -> None:

        key = self.box_key(cred_id)

        value, exists = op.Box.get(key)
        assert exists, "Credential not found"

        # owner check - extract hash length first
        hash_len = op.btoi(op.substring(value, 0, 2))
        owner = self.parse_owner(value, hash_len)
        assert owner == Txn.sender.bytes, "Not credential owner"

        # Check if already revoked
        assert not self.is_revoked(value), "Already revoked"

        new_value = value + Bytes(b"|revoked")

        op.Box.put(key, new_value)


    # -----------------------------
    # Change Access
    # -----------------------------
    @arc4.abimethod()
    def set_access(
        self,
        cred_id: arc4.String,
        access: arc4.String,
    ) -> None:

        # Validate access level
        assert access.native == "public" or access.native == "private", "Invalid access level"

        key = self.box_key(cred_id)

        value, exists = op.Box.get(key)
        assert exists, "Credential not found"

        # owner check
        hash_len = op.btoi(op.substring(value, 0, 2))
        owner = self.parse_owner(value, hash_len)
        assert owner == Txn.sender.bytes, "Not credential owner"

        new_value = value + Bytes(b"|") + access.bytes

        op.Box.put(key, new_value)


    # -----------------------------
    # Delete
    # -----------------------------
    @arc4.abimethod()
    def delete_credential(
        self,
        cred_id: arc4.String,
    ) -> None:

        key = self.box_key(cred_id)

        value, exists = op.Box.get(key)
        assert exists, "Credential not found"

        # owner check
        hash_len = op.btoi(op.substring(value, 0, 2))
        owner = self.parse_owner(value, hash_len)
        assert owner == Txn.sender.bytes, "Not credential owner"

        op.Box.delete(key)
