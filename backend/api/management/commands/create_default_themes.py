from django.core.management.base import BaseCommand
from api.models import Theme, ThemeType


class Command(BaseCommand):
    help = 'Create default predefined themes'

    def handle(self, *args, **options):
        # Delete all existing themes first
        deleted_count = Theme.objects.all().count()
        Theme.objects.all().delete()
        self.stdout.write(f'Deleted {deleted_count} existing themes')

        # Test theme
        test_theme, created = Theme.objects.get_or_create(
            name='Test',
            type=ThemeType.PREDEFINED,
            defaults={
                'colors': {
                    "sidebar": {
                        "background": "#0051FF",
                        "text": "#000000",
                    },
                    "explorer": {
                        "background": "#FF0000",
                        "item": {
                            "background": {
                                "hover": "#2AA11D",
                            },
                            "text": {
                                "default": "#000000",
                                "hover": "#21449F",
                            },
                        },
                    },
                    "main": {
                        "tabs": {
                            "background": "#00FFEA",
                        },
                        "tab": {
                            "text": {
                                "default": "#FFFFFF",
                                "hover": "#525252",
                            },
                            "background": {
                                "default": "#573A3A",
                                "hover": "#FF9696",
                            },
                            "active": {
                                "text": "#840000",
                                "background": "#000000",
                            },
                        },
                        "content": {
                            "background": "#C6C618",
                            "text": "#000000",
                        },
                    },
                    "editor": {
                        "background": "#474BB0",
                        "text": "#428048",
                        "selection": "#FFFFFF",
                        "cursor": "#FFFFFF",
                        "lineNumber": "#FFFFFF",
                        "syntax": {
                            "keyword": "#FFFFFF",
                            "string": "#FFFFFF",
                            "comment": "#FFFFFF",
                            "function": "#FFFFFF",
                            "variable": "#FFFFFF",
                        },
                    },
                }
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(
                f'Created theme: {test_theme.name}'))
        else:
            self.stdout.write(
                f'Theme already exists: {test_theme.name}')

        # Default/Light theme (matches current CSS)
        default_theme, created = Theme.objects.get_or_create(
            name='Light',
            type=ThemeType.PREDEFINED,
            defaults={
                'is_default': False,
                'colors': {
                    "primary": "#3b82f6",
                    "primaryHover": "#2563eb",
                    "secondary": "#64748b",
                    "background": "#ffffff",
                    "surface": "#f8fafc",
                    "surfaceHover": "#f1f5f9",
                    "text": {
                        "primary": "#1f2937",
                        "secondary": "#6b7280",
                        "muted": "#9ca3af",
                        "onPrimary": "#ffffff"
                    },
                    "border": {
                        "default": "#e5e7eb",
                        "hover": "#d1d5db"
                    },
                    "editor": {
                        "background": "#ffffff",
                        "text": "#1f2937",
                        "selection": "#3b82f620",
                        "cursor": "#3b82f6",
                        "lineNumber": "#9ca3af",
                        "syntax": {
                            "keyword": "#7c3aed",
                            "string": "#059669",
                            "comment": "#6b7280",
                            "function": "#dc2626",
                            "variable": "#1f2937"
                        }
                    }
                }
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(
                f'Created theme: {default_theme.name}'))
        else:
            self.stdout.write(
                f'Theme already exists: {default_theme.name}')

        # Dark theme
        dark_theme, created = Theme.objects.get_or_create(
            name='Dark',
            type=ThemeType.PREDEFINED,
            defaults={
                'colors': {
                    "sidebar": {
                        "background": "#111827",
                        "text": "#adadad",
                    },
                    "explorer": {
                        "background": "#1f2937",
                        "item": {
                            "background": {
                                "hover": "#3a4657",
                            },
                            "text": {
                                "default": "#adadad",
                                "hover": "#adadad",
                            },
                        },
                    },
                    "main": {
                        "tabs": {
                            "background": "#1f2937",
                        },
                        "tab": {
                            "text": {
                                "default": "#adadad",
                                "hover": "#adadad",
                            },
                            "background": {
                                "default": "#19202D",
                                "hover": "#19202D",
                            },
                            "active": {
                                "text": "#adadad",
                                "background": "#111827",
                            },
                        },
                        "content": {
                            "background": "#111827",
                            "text": "#adadad",
                        },
                    },
                    "editor": {
                        "background": "#111827",
                        "text": "#adadad",
                        "selection": "#FFFFFF",
                        "cursor": "#adadad",
                        "lineNumber": "#FFFFFF",
                        "syntax": {
                            "keyword": "#FFFFFF",
                            "string": "#FFFFFF",
                            "comment": "#FFFFFF",
                            "function": "#FFFFFF",
                            "variable": "#FFFFFF",
                        },
                    },
                }
            }
        )


        if created:
            self.stdout.write(self.style.SUCCESS(
                f'Created theme: {dark_theme.name}'))
        else:
            self.stdout.write(f'Theme already exists: {dark_theme.name}')

        self.stdout.write(self.style.SUCCESS('Default themes setup complete!'))
