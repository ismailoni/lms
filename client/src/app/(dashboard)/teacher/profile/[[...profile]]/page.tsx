import Header from '@/components/Header'
import { UserProfile } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import React from 'react'

const TeacherProfilePage = () => {
  return (
    <>
        <Header title='Profile' subtitle='View your profile' />
        <UserProfile 
            path='/teacher/profile'
            routing='path'
            appearance={{
                baseTheme: dark,
                elements: {
                    button: {
                        scrollbox: 'bg-customgerys-darkGrey',
                        navbar: {
                            "& > div:nth-child(1)": {
                                background: 'none',
                            },
                        },
                        userButtonIdentifier: 'text-customgerys-dirtyGrey',
                        userButtonBox: 'scale-90 sm:scale-100',
                    },
                },
            }}
        />
    </>
  )
}

export default TeacherProfilePage