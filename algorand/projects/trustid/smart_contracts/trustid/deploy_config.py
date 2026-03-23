import logging
import algokit_utils

logger = logging.getLogger(__name__)


def deploy() -> None:
    from smart_contracts.artifacts.trustid.trust_id_client import (
        TrustIdFactory,
    )

    algorand = algokit_utils.AlgorandClient.from_environment()

    deployer = algorand.account.from_environment("DEPLOYER")

    factory = algorand.client.get_typed_app_factory(
        TrustIdFactory,
        default_sender=deployer.address,
    )

    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )

    print("Deployed TrustID")
    print("App ID:", app_client.app_id)
    print("App Address:", app_client.app_address)
