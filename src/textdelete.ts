/*
    This file is part of MUTE-structs.

    Copyright (C) 2017  Matthieu Nicolas, Victorien Elvinger

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

 import {isInt32} from './int32'
import {LogootSRopes} from './logootsropes'
import {LogootSDel} from './logootsdel'


/**
 * Represents a sequence operation (deletion).
 */
export class TextDelete {

    /**
    * @constructor
    * @param {number} offset - the position of the first element to be deleted in the sequence.
    * @param {number} length - the length of the range to be deleted in the sequence.
    */
    constructor (offset: number, length: number) {
        console.assert(isInt32(offset), "offset  ∈ int32")
        console.assert(isInt32(length), "length  ∈ int32")
        console.assert(length > 0, "length > 0")

        this.offset = offset
        this.length = length
    }

    readonly offset: number

    readonly length: number

    equals (other: TextDelete): boolean {
        return this.offset === other.offset &&
            this.length === other.length
    }

    /**
    * Apply the current delete operation to a LogootSplit document.
    * @param {LogootSDocument} doc - the LogootSplit document on which the deletion wil be performed.
    * @return {LogootSDel} the logootsplit deletion that is related to the deletion that has been performed.
    */
    applyTo (doc: LogootSRopes): LogootSDel {
        return doc.delLocal(this.offset, this.offset + this.length - 1)
    }

}

