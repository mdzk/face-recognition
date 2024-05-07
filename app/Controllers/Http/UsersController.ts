import { Attachment } from '@ioc:Adonis/Addons/AttachmentLite'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import FaceApi from 'App/Services/FaceApi'
import Drive from '@ioc:Adonis/Core/Drive'
import Face from 'App/Models/Face'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import { DateTime } from 'luxon'

export default class UsersController {
  public async register({ request, response }: HttpContextContract) {
    const { face, userId } = await request.validate({
      schema: schema.create({
        userId: schema.number(),
        face: schema.file({
          extnames: ['jpg', 'png'],
        }),
      }),
    })

    const faceDescriptor = await FaceApi.tranformToDescriptor(face.tmpPath!)
    if (!faceDescriptor) return response.unprocessableEntity()

    const faceFile = new Attachment({
      extname: 'json',
      mimeType: 'application/json',
      size: Buffer.from(faceDescriptor.toString()).length,
      name: `${cuid()}.json`,
    })

    faceFile.isPersisted = true

    return await Database.transaction(async (trx) => {
      const faceModel = await Face.updateOrCreate(
        {
          userId: userId,
        },
        {
          file: faceFile,
        },
        {
          client: trx,
        }
      )

      await Drive.put(faceFile.name, faceDescriptor.toString())

      return faceModel.serialize()
    })
  }

  public async check({ request, response }: HttpContextContract) {
    const { face, userId } = await request.validate({
      schema: schema.create({
        face: schema.file({
          extnames: ['jpg', 'png'],
        }),
        userId: schema.number(),
      }),
    })

    try {
      const userFace = await Face.find(userId)
      if (!userFace) {
        throw new Error('Face model not registered yet')
      }

      const faceRef = FaceApi.loadFromString(
        (await Drive.get(userFace.file.name)).toString()
      ).descriptor
      const faceQuery = (await FaceApi.tranformToDescriptor(face.tmpPath!))?.descriptor

      if (!faceQuery) {
        throw new Error('Face not detected')
      }

      if (!FaceApi.matcher(faceRef, faceQuery)) {
        throw new Error('Face not match')
      }

      // No need to save attendance data for verification only
      return { message: 'Face verification successful!' }
    } catch (e) {
      return response.unprocessableEntity({
        message: (e as Error).message,
      })
    }
  }
}
