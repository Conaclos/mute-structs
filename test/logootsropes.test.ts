/*
 *	Copyright 2016 Gerald Oster
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation, either version 3 of the License, or
 * 	(at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.
 *
 *	You should have received a copy of the GNU General Public License
 *	along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import test from "ava"
import {LogootSRopes} from "../src/logootsropes.js"
import * as TextUtils from "../src/textutils.js"

test("basic-insert-del-string", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const event1 = docA.insertLocal(0, "hello world")
    const event2 = docA.delLocal(6, 9)

    event1.execute(docB)
    event2.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("nested-splits", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp1 = docA.insertLocal(0, "hello world")
    insertOp1.execute(docB)

    const insertOp2 = docB.insertLocal(5, "SPLIT")
    insertOp2.execute(docA)

    const insertOp3 = docB.insertLocal(6, "split")
    insertOp3.execute(docA)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("deletion-over-several-identifiers", (t) => {
  const replicaNumberA = 1
  const docA = new LogootSRopes(replicaNumberA)
  const replicaNumberB = 2
  const docB = new LogootSRopes(replicaNumberB)

  const insertOp1 = docA.insertLocal(0, "world")
  insertOp1.execute(docB)

  const insertOp2 = docB.insertLocal(0, "hello ")
  insertOp2.execute(docA)

  const deleteOp = docA.delLocal(4, 3 + "lo wor".length)
  deleteOp.execute(docB)

  t.is(docA.str, docB.str, "docA.str = docB.str")
  t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("insert-should-append-to-splitting-block", (t) => {
  const replicaNumberA = 1
  const docA = new LogootSRopes(replicaNumberA)

  // Insert the initial block
  const event1 = docA.insertLocal(0, "hello world")

  // Split the root and generate a new block
  const event2 = docA.insertLocal(5, "X")
  // Append some text to the previous block
  const event3 = docA.insertLocal(6, "YZ")

  t.is(docA.str, "helloXYZ world", "docA.str = 'helloXYZ world'")
  t.deepEqual(event2.id.base, event3.id.base, "event2.id.base = event3.id.base")
})

test("insert-should-prepend-to-splitting-block", (t) => {
  const replicaNumberA = 1
  const docA = new LogootSRopes(replicaNumberA)

  // Insert the initial block
  const event1 = docA.insertLocal(0, "hello world")

  // Split the root and generate a new block
  const event2 = docA.insertLocal(5, "YZ")
  // Prepend some text to the previous block
  const event3 = docA.insertLocal(5, "X")

  t.is(docA.str, "helloXYZ world", "docA.str = 'helloXYZ world'")
  t.deepEqual(event2.id.base, event3.id.base, "event2.id.base = event3.id.base")
})

test("commutative-insert1-insert2", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const a1 = docA.insertLocal(0, "hello world")
    const b1 = docB.insertLocal(0, "Hello!")

    const a1TxtOps = a1.execute(docB)
    const b1TxtOps = b1.execute(docA)

    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("idempotent-insert", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const a1 = docA.insertLocal(0, "hello world")

    a1.execute(docB)
    a1.execute(docB)

    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("idempotent-insert-after-split", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp1 = docA.insertLocal(0, "hello world")
    insertOp1.execute(docB)

    const insertOp2 = docB.insertLocal(5, "SPLIT")
    insertOp2.execute(docA)

    insertOp1.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test.failing("commutative-insert-deletion", (t) => {
  const replicaNumberA = 1
  const docA = new LogootSRopes(replicaNumberA)
  const replicaNumberB = 2
  const docB = new LogootSRopes(replicaNumberB)

  const insertOp = docA.insertLocal(0, "hello world")
  const deleteOp = docA.delLocal(5, 5 + " world".length)

  deleteOp.execute(docB)
  insertOp.execute(docB)

  t.is(docA.str, docB.str, "docA.str = docB.str")
  t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-split", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp = docA.insertLocal(0, "hello world")
    const splitOp = docA.insertLocal(5, "SPLIT")

    splitOp.execute(docB)
    insertOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-deletion-split", (t) => {
  const replicaNumberA = 1
  const docA = new LogootSRopes(replicaNumberA)
  const replicaNumberB = 2
  const docB = new LogootSRopes(replicaNumberB)

  const insertOp = docA.insertLocal(0, "hello world")
  insertOp.execute(docB)

  const deleteOp = docA.delLocal(4, 3 + "o wor".length)
  const splitOp = docB.insertLocal(5, "SPLIT")
  splitOp.execute(docA)
  deleteOp.execute(docB)

  t.is(docA.str, docB.str, "docA.str = docB.str")
  t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test.failing("commutative-split-deletion", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp = docA.insertLocal(0, "hello world")
    const splitOp = docA.insertLocal(5, "SPLIT")
    const deleteOp = docA.delLocal(5, 4 + "SPLIT".length)

    splitOp.execute(docB)
    deleteOp.execute(docB)
    insertOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-append", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp = docA.insertLocal(0, "hello world")
    const appendOp = docA.insertLocal(11, "APPEND")

    appendOp.execute(docB)
    insertOp.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test.failing("commutative-append1-append2", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const insertOp = docA.insertLocal(0, "hello world")
    const appendOp1 = docA.insertLocal(11, "1")
    const appendOp2 = docA.insertLocal(12, "2")

    insertOp.execute(docB)
    appendOp2.execute(docB)
    appendOp1.execute(docB)

    t.is(docA.str, docB.str, "docA.str = docB.str")
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-append-split-1", (t) => {
  const replicaNumberA = 1
  const docA = new LogootSRopes(replicaNumberA)

  const insertOp = docA.insertLocal(0, "hello")
  const appendOp = docA.insertLocal(5, " world")
  const splitOp = docA.insertLocal(7, "SPLIT")

  const replicaNumberB = 2
  const docB = new LogootSRopes(replicaNumberB)

  insertOp.execute(docB)
  splitOp.execute(docB)
  appendOp.execute(docB)

  t.is(docA.str, docB.str, 'docA.str = docB.str')
  t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})


test("commutative-insert-append-split-2", (t) => {
  const replicaNumberA = 1
  const docA = new LogootSRopes(replicaNumberA)

  const insertOp = docA.insertLocal(0, "hello")
  const appendOp = docA.insertLocal(5, " world")
  const splitOp = docA.insertLocal(7, "SPLIT")

  const replicaNumberB = 2
  const docB = new LogootSRopes(replicaNumberB)

  splitOp.execute(docB)
  appendOp.execute(docB)
  insertOp.execute(docB)

  t.is(docA.str, docB.str, 'docA.str = docB.str')
  t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-append-split-3", (t) => {
  const replicaNumberA = 1
  const docA = new LogootSRopes(replicaNumberA)

  const insertOp = docA.insertLocal(0, "hello")
  const appendOp = docA.insertLocal(5, " world")
  const splitOp = docA.insertLocal(7, "SPLIT")

  const replicaNumberB = 2
  const docB = new LogootSRopes(replicaNumberB)

  splitOp.execute(docB)
  insertOp.execute(docB)
  appendOp.execute(docB)

  t.is(docA.str, docB.str, 'docA.str = docB.str')
  t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-append-split-4", (t) => {
  const replicaNumberA = 1
  const docA = new LogootSRopes(replicaNumberA)

  const insertOp = docA.insertLocal(0, "hello")
  const appendOp = docA.insertLocal(5, " world")
  const splitOp = docA.insertLocal(7, "SPLIT")

  const replicaNumberB = 2
  const docB = new LogootSRopes(replicaNumberB)

  appendOp.execute(docB)
  splitOp.execute(docB)
  insertOp.execute(docB)

  t.is(docA.str, docB.str, 'docA.str = docB.str')
  t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-insert-append-split-5", (t) => {
  const replicaNumberA = 1
  const docA = new LogootSRopes(replicaNumberA)

  const insertOp = docA.insertLocal(0, "hello")
  const appendOp = docA.insertLocal(5, " world")
  const splitOp = docA.insertLocal(7, "SPLIT")

  const replicaNumberB = 2
  const docB = new LogootSRopes(replicaNumberB)

  appendOp.execute(docB)
  insertOp.execute(docB)
  splitOp.execute(docB)

  t.is(docA.str, docB.str, 'docA.str = docB.str')
  t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("commutative-deletion1-deletion2", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const a1 = docA.insertLocal(0, "hello world")
    a1.execute(docB)

    const a2 = docA.delLocal(0, 3)
    const b1 = docB.delLocal(6, 9)
    const a2TxtOps = a2.execute(docB)
    const b1TxtOps = b1.execute(docA)

    t.is(docA.str, docB.str, 'docA.str = docB.str')
    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})

test("idempotent-deletion", (t) => {
    const replicaNumberA = 1
    const docA = new LogootSRopes(replicaNumberA)
    const replicaNumberB = 2
    const docB = new LogootSRopes(replicaNumberB)

    const a1 = docA.insertLocal(0, "hello world")
    a1.execute(docB)

    const a2 = docA.delLocal(0, 3)
    a2.execute(docB)
    a2.execute(docB)

    t.is(docA.digest(), docB.digest(), "docA.digest() = docB.digest()")
})