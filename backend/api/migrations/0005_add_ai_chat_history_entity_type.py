# Generated manually for adding AI_CHAT_HISTORY entity type

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_remove_theme_is_default_entity_delete_note'),
    ]

    operations = [
        migrations.AlterField(
            model_name='entity',
            name='type',
            field=models.CharField(
                choices=[
                    ('note', 'Note'), 
                    ('template', 'Template'), 
                    ('media', 'Media'), 
                    ('view', 'View'), 
                    ('widget', 'Widget'), 
                    ('kanban', 'Kanban'), 
                    ('calendar', 'Calendar'), 
                    ('canvas', 'Canvas'),
                    ('ai_chat_history', 'AI Chat History')
                ], 
                default='note', 
                max_length=50
            ),
        ),
    ]
