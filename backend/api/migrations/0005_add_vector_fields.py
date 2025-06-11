# Generated migration for vector fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_remove_theme_is_default_entity_delete_note'),
    ]

    operations = [
        migrations.AddField(
            model_name='entity',
            name='embedding',
            field=models.JSONField(blank=True, help_text='Vector embedding for semantic search', null=True),
        ),
        migrations.AddField(
            model_name='entity',
            name='embedding_model',
            field=models.CharField(blank=True, help_text='Model used for embedding', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='entity',
            name='embedding_updated_at',
            field=models.DateTimeField(blank=True, help_text='When embedding was last updated', null=True),
        ),
        migrations.AddIndex(
            model_name='entity',
            index=models.Index(fields=['type'], name='api_entity_type_idx'),
        ),
        migrations.AddIndex(
            model_name='entity',
            index=models.Index(fields=['parent'], name='api_entity_parent_idx'),
        ),
        migrations.AddIndex(
            model_name='entity',
            index=models.Index(fields=['updated_at'], name='api_entity_updated_at_idx'),
        ),
        migrations.AddIndex(
            model_name='entity',
            index=models.Index(fields=['embedding_updated_at'], name='api_entity_embedding_updated_at_idx'),
        ),
    ]
