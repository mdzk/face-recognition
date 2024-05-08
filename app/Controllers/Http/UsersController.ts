import { Attachment } from '@ioc:Adonis/Addons/AttachmentLite'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import FaceApi from 'App/Services/FaceApi'
import Drive from '@ioc:Adonis/Core/Drive'
import Face from 'App/Models/Face' // Assuming Face model is defined elsewhere
import { cuid } from '@ioc:Adonis/Core/Helpers'

export default class UsersController {
  public async register({ request, response }: HttpContextContract) {
    const { face, userId } = await request.validate({
      schema: schema.create({
        userId: schema.string([rules.uuid()]),
        face: schema.file({
          extnames: ['jpg', 'png', 'jpeg'],
        }),
      }),
    })

    const hasFace = await FaceApi.tranformToDescriptor(face.tmpPath!)
    if (!hasFace) {
      return response.unprocessableEntity({
        message: 'File yang diunggah tidak mengandung wajah',
      })
    }

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
          userId,
        },
        {
          file: faceFile,
        },
        {
          client: trx,
        }
      )

      await Drive.put(faceFile.name, faceDescriptor.toString())

      return response.accepted({
        success: true,
        message: "Registrasi wajah berhasil!"
      })
    })
  }

  public async check({ request, response }: HttpContextContract) {
    const { face, userId } = await request.validate({
      schema: schema.create({
        face: schema.file({
          extnames: ['jpg', 'png', 'jpeg'],
        }),
        userId: schema.string([rules.uuid()]),
      }),
    })

    try {
      const userFace = await Face.findBy('userId', userId)
      if (!userFace) {
        throw new Error('Wajah belum didaftarkan')
      }

      const faceRef = FaceApi.loadFromString(
        (await Drive.get(userFace.file.name)).toString()
      ).descriptor
      const faceQuery = (await FaceApi.tranformToDescriptor(face.tmpPath!))?.descriptor

      if (!faceQuery) {
        throw new Error('Wajah tidak terdeteksi')
      }

      if (!FaceApi.matcher(faceRef, faceQuery)) {
        throw new Error('Wajah tidak cocok')
      }

      return response.json({
        message: 'Face verification successful!',
      })
    } catch (e) {
      return response.unprocessableEntity({
        message: (e as Error).message,
      })
    }
  }
}
