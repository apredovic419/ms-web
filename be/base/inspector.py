from sanic.worker.inspector import Inspector


class CustomInspector(Inspector):
    async def recover(self):
        """check the status of all server processes. If the status is FAILED or COMPLETED, then restart them"""
        for process_name, info in self._make_safe(dict(self.worker_state)).items():
            if info.get("server") is True and info.get("state") in {"FAILED", "COMPLETED"}:
                self._publisher.send(process_name)
