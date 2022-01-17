PAYER_KEYPAIR_FILE=payer-keypair.json
PROGRAM_KEYPAIR_FILE=program-keypair.json
ADMIN_KEYPAIR_FILE=admin-keypair.json

echo "CLEANUP"
rm -rf test-ledger
rm "./$PAYER_KEYPAIR_FILE"
rm "./$PROGRAM_KEYPAIR_FILE"
rm "./$ADMIN_KEYPAIR_FILE"

echo "KILLING VALIDATOR"
VALIDATOR_PID=$(pgrep solana-test-validator)
echo "VALIDATOR_PID: $VALIDATOR_PID"
kill -9 "$VALIDATOR_PID"
