"""Simplified DES (S-DES) implementation in Python.

This module ports the original web-based calculator logic into a small
command-line friendly Python version.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from typing import List, Sequence, Tuple


def _validate_bits(bits: Sequence[int], expected_length: int) -> None:
    if len(bits) != expected_length:
        raise ValueError(f"expected {expected_length} bits, got {len(bits)}")
    if any(bit not in (0, 1) for bit in bits):
        raise ValueError("bits must contain only 0 and 1")


def _to_bits(text: str, expected_length: int) -> List[int]:
    if len(text) != expected_length or any(char not in "01" for char in text):
        raise ValueError(f"expected a {expected_length}-bit binary string")
    return [int(char) for char in text]


def _to_bit_string(bits: Sequence[int]) -> str:
    return "".join(str(bit) for bit in bits)


def p10(input_key: Sequence[int]) -> List[int]:
    permutation = [3, 5, 2, 7, 4, 10, 1, 9, 8, 6]
    _validate_bits(input_key, 10)
    return [input_key[index - 1] for index in permutation]


def p8(input_key: Sequence[int]) -> List[int]:
    permutation = [6, 3, 7, 4, 8, 5, 10, 9]
    _validate_bits(input_key, 10)
    return [input_key[index - 1] for index in permutation]


def split_string(input_string: Sequence[int]) -> Tuple[List[int], List[int]]:
    if len(input_string) % 2 == 1:
        raise ValueError("cannot split an odd-length bit sequence")
    midpoint = len(input_string) // 2
    return list(input_string[:midpoint]), list(input_string[midpoint:])


def left_shift(input_key: Sequence[int], shift_length: int) -> List[int]:
    if len(input_key) < 1:
        raise ValueError("cannot shift an empty bit sequence")
    key_length = len(input_key)
    return [input_key[(index + shift_length) % key_length] for index in range(key_length)]


def ip(input_string: Sequence[int]) -> List[int]:
    permutation = [2, 6, 3, 1, 4, 8, 5, 7]
    _validate_bits(input_string, 8)
    return [input_string[index - 1] for index in permutation]


def ip_inverse(input_string: Sequence[int]) -> List[int]:
    permutation = [4, 1, 3, 5, 7, 2, 8, 6]
    _validate_bits(input_string, 8)
    return [input_string[index - 1] for index in permutation]


def ep(input_string: Sequence[int]) -> List[int]:
    permutation = [4, 1, 2, 3, 2, 3, 4, 1]
    _validate_bits(input_string, 4)
    return [input_string[index - 1] for index in permutation]


def p4(input_string: Sequence[int]) -> List[int]:
    permutation = [2, 4, 3, 1]
    _validate_bits(input_string, 4)
    return [input_string[index - 1] for index in permutation]


def xor(input_string: Sequence[int], key: Sequence[int]) -> List[int]:
    if len(input_string) < 1 or len(input_string) != len(key):
        raise ValueError("bit strings must have the same non-zero length")
    _validate_bits(input_string, len(input_string))
    _validate_bits(key, len(key))
    return [left ^ right for left, right in zip(input_string, key)]


def sbox(input_string: Sequence[int], sbox_index: int) -> List[int]:
    sbox_definition = [
        [
            [[[0], [1]], [[0], [0]], [[1], [1]], [[1], [0]]],
            [[[1], [1]], [[1], [0]], [[0], [1]], [[0], [0]]],
            [[[0], [0]], [[1], [0]], [[0], [1]], [[1], [1]]],
            [[[1], [1]], [[0], [1]], [[1], [1]], [[1], [0]]],
        ],
        [
            [[[0], [0]], [[0], [1]], [[1], [0]], [[1], [1]]],
            [[[1], [0]], [[0], [0]], [[0], [1]], [[1], [1]]],
            [[[1], [1]], [[0], [0]], [[0], [1]], [[0], [0]]],
            [[[1], [0]], [[0], [1]], [[0], [0]], [[1], [1]]],
        ],
    ]

    _validate_bits(input_string, 4)
    if sbox_index not in (0, 1):
        raise ValueError("sbox index must be 0 or 1")

    row = (input_string[0] << 1) + input_string[3]
    col = (input_string[1] << 1) + input_string[2]
    return [bit[0] for bit in sbox_definition[sbox_index][row][col]]


def switch_function(left_string: Sequence[int], right_string: Sequence[int]) -> Tuple[List[int], List[int]]:
    return list(right_string), list(left_string)


@dataclass
class Trace:
    text: List[int] = field(default_factory=list)
    key: List[int] = field(default_factory=list)
    after_p10_key: List[int] = field(default_factory=list)
    after_first_split_left: List[int] = field(default_factory=list)
    after_first_split_right: List[int] = field(default_factory=list)
    after_left_ls1: List[int] = field(default_factory=list)
    after_right_ls1: List[int] = field(default_factory=list)
    sub_key_k1: List[int] = field(default_factory=list)
    after_left_ls2: List[int] = field(default_factory=list)
    after_right_ls2: List[int] = field(default_factory=list)
    sub_key_k2: List[int] = field(default_factory=list)
    after_ip: List[int] = field(default_factory=list)
    after_ip_split_left: List[int] = field(default_factory=list)
    after_ip_split_right: List[int] = field(default_factory=list)
    after_ep_round1: List[int] = field(default_factory=list)
    after_xor_k1: List[int] = field(default_factory=list)
    after_xor_k1_split_left: List[int] = field(default_factory=list)
    after_xor_k1_split_right: List[int] = field(default_factory=list)
    after_s0_round1: List[int] = field(default_factory=list)
    after_s1_round1: List[int] = field(default_factory=list)
    after_p4_round1: List[int] = field(default_factory=list)
    after_final_xor_round1: List[int] = field(default_factory=list)
    result_of_round_function_fk1: List[int] = field(default_factory=list)
    after_switch: List[int] = field(default_factory=list)
    after_switch_split_left: List[int] = field(default_factory=list)
    after_switch_split_right: List[int] = field(default_factory=list)
    after_ep_round2: List[int] = field(default_factory=list)
    after_xor_k2: List[int] = field(default_factory=list)
    after_xor_k2_split_left: List[int] = field(default_factory=list)
    after_xor_k2_split_right: List[int] = field(default_factory=list)
    after_s0_round2: List[int] = field(default_factory=list)
    after_s1_round2: List[int] = field(default_factory=list)
    after_p4_round2: List[int] = field(default_factory=list)
    after_final_xor_round2: List[int] = field(default_factory=list)
    result_of_round_function_fk2: List[int] = field(default_factory=list)
    final_result: List[int] = field(default_factory=list)


def sdes_key_generator(input_key: Sequence[int], trace: Trace | None = None) -> Tuple[List[int], List[int]]:
    _validate_bits(input_key, 10)

    after_p10_key = p10(input_key)
    left_key, right_key = split_string(after_p10_key)

    left_ls1 = left_shift(left_key, 1)
    right_ls1 = left_shift(right_key, 1)
    output_key1 = p8(left_ls1 + right_ls1)

    left_ls2 = left_shift(left_ls1, 2)
    right_ls2 = left_shift(right_ls1, 2)
    output_key2 = p8(left_ls2 + right_ls2)

    if trace is not None:
        trace.after_p10_key = after_p10_key
        trace.after_first_split_left = left_key
        trace.after_first_split_right = right_key
        trace.after_left_ls1 = left_ls1
        trace.after_right_ls1 = right_ls1
        trace.sub_key_k1 = output_key1
        trace.after_left_ls2 = left_ls2
        trace.after_right_ls2 = right_ls2
        trace.sub_key_k2 = output_key2

    return output_key1, output_key2


def mapping_function(input_string: Sequence[int], key: Sequence[int], current_round_number: int, trace: Trace | None = None) -> List[int]:
    post_ep_string = ep(input_string)
    xored = xor(post_ep_string, key)
    left_string, right_string = split_string(xored)
    sbox_left = sbox(left_string, 0)
    sbox_right = sbox(right_string, 1)
    output_string = p4(sbox_left + sbox_right)

    if trace is not None:
        if current_round_number == 1:
            trace.after_ep_round1 = post_ep_string
            trace.after_xor_k1 = xored
            trace.after_xor_k1_split_left = left_string
            trace.after_xor_k1_split_right = right_string
            trace.after_s0_round1 = sbox_left
            trace.after_s1_round1 = sbox_right
            trace.after_p4_round1 = output_string
        else:
            trace.after_ep_round2 = post_ep_string
            trace.after_xor_k2 = xored
            trace.after_xor_k2_split_left = left_string
            trace.after_xor_k2_split_right = right_string
            trace.after_s0_round2 = sbox_left
            trace.after_s1_round2 = sbox_right
            trace.after_p4_round2 = output_string

    return output_string


def round_function(left_string: Sequence[int], right_string: Sequence[int], key: Sequence[int], current_round_number: int, trace: Trace | None = None) -> Tuple[List[int], List[int]]:
    mapping_result = mapping_function(right_string, key, current_round_number, trace)
    new_left = xor(left_string, mapping_result)

    if trace is not None:
        if current_round_number == 1:
            trace.after_final_xor_round1 = new_left
        else:
            trace.after_final_xor_round2 = new_left

    return new_left, list(right_string)


def sdes(input_text: Sequence[int], key: Sequence[int], encrypt: bool = True, trace: Trace | None = None) -> List[int]:
    _validate_bits(input_text, 8)
    _validate_bits(key, 10)

    round_key_1, round_key_2 = sdes_key_generator(key, trace)
    round_keys = [round_key_1, round_key_2]

    post_ip_text = ip(input_text)
    left_text, right_text = split_string(post_ip_text)

    if trace is not None:
        trace.text = list(input_text)
        trace.key = list(key)
        trace.after_ip = post_ip_text
        trace.after_ip_split_left = left_text
        trace.after_ip_split_right = right_text

    current_left = left_text
    current_right = right_text

    for round_index in range(2):
        key_index = round_index if encrypt else 1 - round_index
        current_left, current_right = round_function(
            current_left,
            current_right,
            round_keys[key_index],
            round_index + 1,
            trace,
        )

        if trace is not None:
            if round_index == 0:
                trace.result_of_round_function_fk1 = current_left + current_right
            else:
                trace.result_of_round_function_fk2 = current_left + current_right

        if round_index < 1:
            current_left, current_right = switch_function(current_left, current_right)
            if trace is not None:
                trace.after_switch = current_left + current_right
                trace.after_switch_split_left = current_left
                trace.after_switch_split_right = current_right

    output_text = ip_inverse(current_left + current_right)

    if trace is not None:
        trace.final_result = output_text

    return output_text


def encrypt_bits(plaintext: str, key: str, trace: Trace | None = None) -> str:
    return _to_bit_string(sdes(_to_bits(plaintext, 8), _to_bits(key, 10), encrypt=True, trace=trace))


def decrypt_bits(ciphertext: str, key: str, trace: Trace | None = None) -> str:
    return _to_bit_string(sdes(_to_bits(ciphertext, 8), _to_bits(key, 10), encrypt=False, trace=trace))


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Simplified DES calculator in Python")
    parser.add_argument("mode", choices=["encrypt", "decrypt"], help="operation mode")
    parser.add_argument("text", help="8-bit binary text")
    parser.add_argument("key", help="10-bit binary key")
    parser.add_argument("--trace", action="store_true", help="print intermediate steps")
    return parser


def _print_trace(trace: Trace) -> None:
    print("Trace:")
    fields = [
        ("after_p10_key", trace.after_p10_key),
        ("sub_key_k1", trace.sub_key_k1),
        ("sub_key_k2", trace.sub_key_k2),
        ("after_ip", trace.after_ip),
        ("after_switch", trace.after_switch),
        ("final_result", trace.final_result),
    ]
    for label, values in fields:
        if values:
            print(f"  {label}: {_to_bit_string(values)}")


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    trace = Trace() if args.trace else None

    if args.mode == "encrypt":
        result = encrypt_bits(args.text, args.key, trace)
    else:
        result = decrypt_bits(args.text, args.key, trace)

    print(result)
    if trace is not None:
        _print_trace(trace)


if __name__ == "__main__":
    main()