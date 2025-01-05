from typing import Any, Literal

from pypika.terms import Function
from tortoise.expressions import F


class JsonContains(Function):
    def __init__(self, column_name, target, path):
        super(JsonContains, self).__init__("JSON_CONTAINS", column_name, target, path)


class JsonContainsPath(Function):
    """JSON_CONTAINS_PATH(json_doc, one_or_all, path[, path] ...)

    :param json_doc: A JSON document
    :param one_or_all: 'one' or 'all'
    :param path: A path expression to search for in the document
    """

    def __init__(self, column_name, one_or_all: Literal["one", "all"], *paths):
        super(JsonContainsPath, self).__init__(
            "JSON_CONTAINS_PATH", column_name, one_or_all, *paths
        )


class JsonQuote(Function):
    """JSON_QUOTE(string)

    Quotes a string as a JSON value by wrapping it with double quote characters and
    escaping interior quote and other characters, then returning the result as a utf8mb4 string.
    Returns NULL if the argument is NULL.

    """

    def __init__(self, value: str):
        super(JsonQuote, self).__init__("JSON_QUOTE", value)


class JsonSet(Function):
    """JSON_SET(json_doc, path, val[, path, val] ...)

    https://dev.mysql.com/doc/refman/8.0/en/json-modification-functions.html#function_json-set

    Inserts or updates data in a JSON document and returns the result.
    Returns NULL if json_doc or path is NULL, or if path, when given, does not locate an object.
    Otherwise, an error occurs if the json_doc argument is not a valid JSON document or any path
    argument is not a valid path expression or contains a * or ** wildcard.

    The JSON_SET(), JSON_INSERT(), and JSON_REPLACE() functions are related:

        JSON_SET() replaces existing values and adds nonexisting values.

        JSON_INSERT() inserts values without replacing existing values.

        JSON_REPLACE() replaces only existing values.

    :param field: The field to modify
    :param path: json path
    :param value: The value to set
    :param args: Optional arguments
    """

    def __init__(self, field: F | str, path: str, value: Any, *args):
        super().__init__("JSON_SET", field, path, value, *args)


class JsonInsert(Function):
    """JSON_INSERT(json_doc, path, val[, path, val] ...)

    Inserts data into a JSON document and returns the result.

    :param field: The field to modify
    :param path: json path
    :param value: The value to insert
    :param args: Optional arguments

    """

    def __init__(self, field: F | str, path: str, value: Any, *args):
        super().__init__("JSON_INSERT", field, path, value, *args)


class JsonReplace(Function):
    """JSON_REPLACE(json_doc, path, val[, path, val] ...)

    Replaces existing values in a JSON document and returns the result.

    :param field: The field to modify
    :param path: json path
    :param value: The value to replace
    :param args: Optional arguments

    """

    def __init__(self, field: F | str, path: str, value: Any, *args):
        super().__init__("JSON_REPLACE", field, path, value, *args)


class JsonRemove(Function):
    """JSON_REMOVE(json_doc, path[, path] ...)

    Removes data from a JSON document and returns the result.

    :param field: The field to modify
    :param path: json path
    :param args: Optional arguments

    """

    def __init__(self, field: F | str, path: str, *args):
        super().__init__("JSON_REMOVE", field, path, *args)
